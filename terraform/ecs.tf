resource "aws_ecs_cluster" "this" {
  name = "${var.project_name}-${var.env}-cluster"

  tags = {
    Name = "${var.project_name}-${var.env}-cluster"
  }
}

resource "aws_ecs_cluster_capacity_providers" "this" {
  cluster_name = aws_ecs_cluster.this.name

  capacity_providers = ["FARGATE_SPOT"]

  default_capacity_provider_strategy {
    capacity_provider = "FARGATE_SPOT"
  }
}

resource "aws_ecs_task_definition" "this" {
  family = "${var.project_name}-${var.env}-task"

  container_definitions = jsonencode(
    [
      {
        "name" : "${var.project_name}-${var.env}-container",
        "image" : "${var.image_uri}",
        "entryPoint" : [],
        "essential" : true,
        "logConfiguration" : {
          "logDriver" : "awslogs",
          "options" : {
            "awslogs-group" : "${aws_cloudwatch_log_group.this.id}",
            "awslogs-region" : "${var.aws_region}",
            "awslogs-stream-prefix" : "${var.project_name}-sample-app"
          }
        },
        # mongodb+srv://masat-dev-username:<db_password>@masat-dev-cluster.annucyt.mongodb.net/?retryWrites=true&w=majority&appName=masat-dev-cluster
        # "mongodb+srv://masat-dev-username:jcxI9%oc5nQsC9cG@masat-dev-cluster.annucyt.mongodb.net?retryWrites=true&w=majority&appName=masat"
        environment = [
          {
            "name" : "MONGODB_URI",
            "value" : "${replace(mongodbatlas_serverless_instance.test.connection_strings_standard_srv, "mongodb+srv://", "mongodb+srv://${mongodbatlas_database_user.test.username}:${random_password.db_user_password.result}@")}/masat?retryWrites=true&w=majority&appName=${var.project_name}"
          },
          {
            "name" : "MONGODB_CLUSTER",
            "value" : replace(mongodbatlas_serverless_instance.test.connection_strings_standard_srv, "mongodb+srv://", "")
          },
          {
            "name" : "MONGODB_DATABASE",
            "value" : var.project_name
          },
          {
            "name" : "NEXT_PUBLIC_RESPONSE_ENCRYPTION_KEY",
            "value" : "UkVTUE9OU0VfRU5DUllQVElPTl9LRVlfMzJfQllURVM="
          },
          {
            "name" : "ENCRYPTION_KEY",
            "value" : "0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef"
          },
          {
            "name" : "ENCRYPTION_IV",
            "value" : "0123456789abcdef"
          },
          {
            "name" : "S3_BUCKET_NAME",
            "value" : "${aws_s3_bucket.this.bucket}"
          },
          {
            "name" : "NEXTAUTH_SECRET",
            "value" : "${var.nextauth_secret}"
          },
          {
            "name" : "NEXTAUTH_URL",
            "value" : "https://${local.url}"
          },
          {
            "name" : "GOOGLE_CLIENT_ID",
            "value" : "${var.google_client_id}"
          },
          {
            "name" : "GOOGLE_CLIENT_SECRET",
            "value" : "${var.google_client_secret}"
          }
        ]
        "portMappings" : [
          {
            "containerPort" : 3000

          }
        ],
        "cpu" : 256,
        "memory" : 512,
        "networkMode" : "awsvpc"
      }
    ])

  requires_compatibilities = ["FARGATE"]
  network_mode             = "awsvpc"
  cpu                      = "512"
  memory                   = "1024"
  execution_role_arn       = aws_iam_role.ecs_task_execution.arn
  task_role_arn            = aws_iam_role.ecs_task_role.arn

  tags = {
    Name = "${var.project_name}-${var.env}-ecs-task_definition"
  }
}

resource "aws_cloudwatch_log_group" "this" {
  name = "${var.project_name}-${var.env}-logs"

  tags = {
    Name = "${var.project_name}-${var.env}-logs"
  }
}

data "aws_ecs_task_definition" "main" {
  task_definition = aws_ecs_task_definition.this.family
}

resource "aws_ecs_service" "this" {
  name                 = "${var.project_name}-${var.env}-ecs-service"
  cluster              = aws_ecs_cluster.this.id
  task_definition      = "${aws_ecs_task_definition.this.family}:${max(aws_ecs_task_definition.this.revision, data.aws_ecs_task_definition.main.revision)}"
  scheduling_strategy  = "REPLICA"
  desired_count        = 1
  force_new_deployment = true

  network_configuration {
    subnets          = [for subnet in aws_subnet.private_app : subnet.id]
    assign_public_ip = false
    security_groups = [
      aws_security_group.service.id
    ]
  }

  load_balancer {
    target_group_arn = aws_lb_target_group.this.arn
    container_name   = "${var.project_name}-${var.env}-container"
    container_port   = 3000
  }

  capacity_provider_strategy {
    capacity_provider = "FARGATE_SPOT"
    weight            = 100
  }

}

resource "aws_security_group" "service" {
  vpc_id      = aws_vpc.this.id
  name        = "${var.project_name}-${var.env}-service-sg"
  description = "Allow inbound access from the ALB only"
  ingress {
    from_port = 0
    to_port   = 0
    protocol  = "-1"
    security_groups = [aws_security_group.load_balancer.id]
  }

  egress {
    from_port = 0
    to_port   = 0
    protocol  = "-1"
    cidr_blocks = ["0.0.0.0/0"]
    ipv6_cidr_blocks = ["::/0"]
  }

  tags = {
    Name = "${var.project_name}-${var.env}-service-sg"
  }
}

resource "aws_s3_bucket" "this" {
  bucket = "${var.project_name}-${var.env}-bucket"

  tags = {
    Name = "${var.project_name}-${var.env}-bucket"
  }
}

# Set ACL for the bucket
resource "aws_s3_bucket_acl" "this" {
  bucket = aws_s3_bucket.this.id
  acl    = "public-read"
  
  # Must be configured after ownership controls
  depends_on = [aws_s3_bucket_ownership_controls.this]
}

# Configure CORS for the S3 bucket
resource "aws_s3_bucket_cors_configuration" "this" {
  bucket = aws_s3_bucket.this.bucket

  cors_rule {
    allowed_headers = ["*"]
    allowed_methods = ["GET", "PUT", "POST", "DELETE", "HEAD"]
    allowed_origins = ["*"]  # In production, you should restrict this to your domain
    expose_headers  = ["ETag"]
    max_age_seconds = 3000
  }
}

# Configure public access block for the S3 bucket
resource "aws_s3_bucket_public_access_block" "this" {
  bucket = aws_s3_bucket.this.bucket

  block_public_acls       = false
  block_public_policy     = false
  ignore_public_acls      = false
  restrict_public_buckets = false
}

# Set bucket ownership controls
resource "aws_s3_bucket_ownership_controls" "this" {
  bucket = aws_s3_bucket.this.bucket
  
  rule {
    object_ownership = "BucketOwnerPreferred"
  }
}

# Create a bucket policy to allow public read access
resource "aws_s3_bucket_policy" "this" {
  bucket = aws_s3_bucket.this.bucket
  
  # Wait for the public access block to be configured first
  depends_on = [aws_s3_bucket_public_access_block.this]

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Principal = "*"
        Action = [
          "s3:GetObject"
        ]
        Effect = "Allow"
        Resource = [
          "${aws_s3_bucket.this.arn}/*"
        ]
      }
    ]
  })
}

# The aws_iam_policy for S3 access is defined in iam.tf
# We'll keep only the attachment here, which references the policy

resource "aws_iam_role_policy_attachment" "ecs_task_s3_policy_attachment" {
  role       = aws_iam_role.ecs_task_execution.name
  policy_arn = aws_iam_policy.ecs_task_s3_policy.arn
}