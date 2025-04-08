#IAM role for ecs task
resource "aws_iam_role" "ecs_task_execution" {
  name = "${var.project_name}-${var.env}-iam_role_for_ecs_task_exec"

  assume_role_policy = <<EOF
{
 "Version": "2012-10-17",
 "Statement": [
   {
     "Action": "sts:AssumeRole",
     "Principal": {
       "Service": "ecs-tasks.amazonaws.com"
     },
     "Effect": "Allow",
     "Sid": ""
   }
 ]
}
EOF
}

resource "aws_iam_role_policy_attachment" "ecs_task_execution" {
  role       = aws_iam_role.ecs_task_execution.name
  policy_arn = "arn:aws:iam::aws:policy/service-role/AmazonECSTaskExecutionRolePolicy"
}

# Create a task role for the container to use when accessing AWS services
resource "aws_iam_role" "ecs_task_role" {
  name = "${var.project_name}-${var.env}-iam_role_for_ecs_task"

  assume_role_policy = <<EOF
{
 "Version": "2012-10-17",
 "Statement": [
   {
     "Action": "sts:AssumeRole",
     "Principal": {
       "Service": "ecs-tasks.amazonaws.com"
     },
     "Effect": "Allow",
     "Sid": ""
   }
 ]
}
EOF
}

# Attach S3 permissions to the task role
resource "aws_iam_role_policy_attachment" "ecs_task_s3_policy_attachment_task_role" {
  role       = aws_iam_role.ecs_task_role.name
  policy_arn = aws_iam_policy.ecs_task_s3_policy.arn
}

resource "aws_iam_policy" "ecs_task_s3_policy" {
  name        = "${var.project_name}-${var.env}-ecs-task-s3-policy"
  description = "Policy for ECS task to access S3 bucket"
  policy      = jsonencode({
    Version = "2012-10-17",
    Statement = [
      {
        Effect   = "Allow",
        Action   = [
          "s3:ListBucket",
          "s3:GetBucketLocation",
          "s3:ListAllMyBuckets"
        ],
        Resource = [
          "arn:aws:s3:::${aws_s3_bucket.this.bucket}",
          "arn:aws:s3:::*"
        ]
      },
      {
        Effect   = "Allow",
        Action   = [
          "s3:GetObject", 
          "s3:PutObject", 
          "s3:DeleteObject",
          "s3:ListMultipartUploadParts",
          "s3:AbortMultipartUpload"
        ],
        Resource = ["arn:aws:s3:::${aws_s3_bucket.this.bucket}/*"]
      }
    ]
  })
}

resource "aws_iam_role_policy_attachment" "ses_send_email_policy_attachment_task_role" {
  role       = aws_iam_role.ecs_task_role.name
  policy_arn = aws_iam_policy.ses_send_email_policy.arn
}

resource "aws_iam_policy" "ses_send_email_policy" {
  name        = "${var.project_name}-${var.env}-ses-send-email-policy"
  description = "Policy to allow sending emails through SES using a verified identity"
  policy      = jsonencode({
    Version = "2012-10-17",
    Statement = [
      {
        Effect   = "Allow",
        Action   = [
          "ses:SendEmail",
          "ses:SendRawEmail"
        ],
        Resource = "arn:aws:ses:${var.aws_region}:754127347866:identity/shiftcrowd.eu"
      }
    ]
  })
}
