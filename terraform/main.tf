terraform {
  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "5.91.0"
    }
    docker = {
      source  = "kreuzwerker/docker"
      version = ">= 3.0"
    }
  }

  backend "s3" {
    bucket = "terraformemag"
    key    = "terraform-masat-nextjs.tfstate"
    region = "eu-central-1"
  }
}

locals {
    project_name = "masat-next"
    source_path  = dirname(path.module)
    path_include  = ["**"]
    path_exclude  = ["**/node_modules/**", "**/.idea/**", "**/terraform/**", "**/*.tf"]
    files_include = setunion([for f in local.path_include : fileset(local.source_path, f)]...)
    files_exclude = setunion([for f in local.path_exclude : fileset(local.source_path, f)]...)
    files         = sort(setsubtract(local.files_include, local.files_exclude))

    dir_sha = sha1(join("", [for f in local.files : filesha1("${local.source_path}/${f}")]))
}

data "aws_ecr_authorization_token" "token" {}

data "aws_caller_identity" "this" {}

data "aws_region" "current" {}

provider "aws" {
  region = var.aws_region # region of the user account
}

provider "docker" {
  host = "unix:///var/run/docker.sock"
  registry_auth {
    address  = format("%v.dkr.ecr.%v.amazonaws.com", data.aws_caller_identity.this.account_id, data.aws_region.current.name)
    username = data.aws_ecr_authorization_token.token.user_name
    password = data.aws_ecr_authorization_token.token.password
  }
}

module "docker_build" {
  source = "./modules/docker-build"

  create_ecr_repo = true
  ecr_repo        = "${local.project_name}-${var.env}"
  ecr_repo_lifecycle_policy = jsonencode({
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

  use_image_tag = false # If false, sha of the image will be used

  # use_image_tag = true
  # image_tag   = "2.0"

  source_path = local.source_path
  platform    = "linux/amd64"
  build_args = {
    FOO = "bar"
  }

  triggers = {
    dir_sha = local.dir_sha
  }
}