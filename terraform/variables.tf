# Define the variable for the AWS region
variable "aws_region" {
  description = "The AWS region to deploy resources in"
  type        = string
  default     = "eu-central-1"
}

# Define the variable for the AWS region
variable "env" {
  description = "Name of the environment"
  type        = string
  default     = "dev"
}

variable "project_name" {
  description = "The name of the project used for tagging resources"
  type        = string
  default     = "masat"
}
variable "cidr" {
  description = "(Optional) The IPv4 CIDR block for the VPC. CIDR can be explicitly set or it can be derived from IPAM using `ipv4_netmask_length` & `ipv4_ipam_pool_id`"
  type        = string
  default     = "10.0.0.0/16"
}