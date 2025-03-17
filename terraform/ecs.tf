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
        "image" : "${module.docker_build.image_uri}",
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
        environment = [
          {
            "name" : "MONGODB_URI",
            "value" : "mongodb+srv://masat:qlXQItiG3UzoENFI@masatdev.hosmfl0.mongodb.net/?retryWrites=true&w=majority&appName=masatdev"
          },
          {
            "name" : "MONGODB_CLUSTER",
            "value" : "masatdev.hosmfl0.mongodb.net"
          },
          {
            "name" : "MONGODB_DATABASE",
            "value" : "masatdev"
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
          }
        ]
        "portMappings" : [
          {
            "containerPort" : 3000

          }
        ],
        "cpu" : 512,
        "memory" : 1024,
        "networkMode" : "awsvpc"
      }
    ])

  requires_compatibilities = ["FARGATE"]
  network_mode       = "awsvpc"
  cpu                = "512"
  memory             = "1024"
  execution_role_arn = aws_iam_role.ecs_task_execution.arn

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

  