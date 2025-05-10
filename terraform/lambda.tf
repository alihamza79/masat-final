# Environment Variables


variable "api_url" {
  description = "The URL of the API endpoint"
  type        = string
  default     = "https://masat-dev.shiftcrowd.eu"
}

variable "recurring_expenses_api_key" {
  description = "API key for recurring expenses authentication"
  type        = string
  default     = "masat_rec_live_8f2a61b3e4d95c7f16940adb7c852x9p"
  sensitive   = true
}

# IAM role for the Lambda function
resource "aws_iam_role" "lambda_daily_task" {
  name = "${var.project_name}-${var.env}-lambda-daily-task-role"

  assume_role_policy = <<EOF
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Action": "sts:AssumeRole",
      "Principal": {
        "Service": "lambda.amazonaws.com"
      },
      "Effect": "Allow",
      "Sid": ""
    }
  ]
}
EOF
}

# Attach basic Lambda execution policy to the role
resource "aws_iam_role_policy_attachment" "lambda_basic_execution" {
  role       = aws_iam_role.lambda_daily_task.name
  policy_arn = "arn:aws:iam::aws:policy/service-role/AWSLambdaBasicExecutionRole"
}

# Create an archive of the Lambda function code
data "archive_file" "lambda_daily_task" {
  type        = "zip"
  source_dir  = "${path.module}/../lambdas/daily-task"
  output_path = "${path.module}/../lambdas/daily-task.zip"
  excludes    = ["node_modules/.cache"] # Exclude cache files
}

# Lambda function resource
resource "aws_lambda_function" "daily_task" {
  filename         = data.archive_file.lambda_daily_task.output_path
  function_name    = "${var.project_name}-${var.env}-daily-task"
  role             = aws_iam_role.lambda_daily_task.arn
  handler          = "index.handler"
  source_code_hash = data.archive_file.lambda_daily_task.output_base64sha256
  runtime          = "nodejs18.x"
  timeout          = 60
  memory_size      = 128

  environment {
    variables = {
      ENV                       = var.env
      API_URL                   = var.api_url
      RECURRING_EXPENSES_API_KEY = var.recurring_expenses_api_key
    }
  }

  tags = {
    Name        = "${var.project_name}-${var.env}-daily-task"
    Environment = var.env
  }
}

# CloudWatch Events/EventBridge rule to trigger the Lambda every 5 minutes
resource "aws_cloudwatch_event_rule" "daily_task_schedule" {
  name                = "${var.project_name}-${var.env}-daily-task-schedule"
  description         = "Triggers the daily task Lambda function every 5 minutes"
  schedule_expression = "cron(0/5 * * * ? *)" # Run every 5 minutes using cron expression

  tags = {
    Name        = "${var.project_name}-${var.env}-daily-task-schedule"
    Environment = var.env
  }
}

# Target to connect the CloudWatch Events/EventBridge rule to the Lambda function
resource "aws_cloudwatch_event_target" "daily_task_target" {
  rule      = aws_cloudwatch_event_rule.daily_task_schedule.name
  target_id = "daily-task-lambda"
  arn       = aws_lambda_function.daily_task.arn
}

# Permission to allow CloudWatch Events/EventBridge to invoke the Lambda function
resource "aws_lambda_permission" "allow_cloudwatch_to_call_daily_task" {
  statement_id  = "AllowExecutionFromCloudWatch"
  action        = "lambda:InvokeFunction"
  function_name = aws_lambda_function.daily_task.function_name
  principal     = "events.amazonaws.com"
  source_arn    = aws_cloudwatch_event_rule.daily_task_schedule.arn
}