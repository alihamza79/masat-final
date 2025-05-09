terraform {
  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "5.91.0"
    }
    mongodbatlas = {
      source = "mongodb/mongodbatlas"
    }
    archive = {
      source  = "hashicorp/archive"
      version = "~> 2.4.0"
    }
  }

  backend "s3" {
    bucket = "terraformemag"
    key    = "terraform-masat-nextjs.tfstate"
    region = "eu-central-1"
  }
}

locals {
    project_name = "masat"
}


data "aws_caller_identity" "this" {}


provider "aws" {
  region = var.aws_region # region of the user account
}

resource "aws_ecr_repository" "this" {
  force_delete         = true
  name                 = "${local.project_name}-${var.env}"
  image_tag_mutability = "MUTABLE"
}

resource "aws_ecr_lifecycle_policy" "this" {
  policy     = jsonencode({
    "rules" : [
      {
        "rulePriority" : 1,
        "description" : "Keep only the last 2 images",
        "selection" : {
          "tagStatus" : "any",
          "countType" : "imageCountMoreThan",
          "countNumber" : 2
        },
        "action" : {
          "type" : "expire"
        }
      }
    ]
  })
  repository = aws_ecr_repository.this.name
}
