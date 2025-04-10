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

variable "image_uri" {
  type = string
  description = "Docker image URI"
}

variable "mongo_atlas_public_key" {
  type = string
  sensitive = true
}

variable "mongo_atlas_private_key" {
  type = string
  sensitive = true
}

variable "atlas_org_id" {
  type = string
}

variable "google_client_id" {
  description = "Google OAuth Client ID"
  type        = string
  sensitive   = true
}

variable "google_client_secret" {
  description = "Google OAuth Client Secret"
  type        = string
  sensitive   = true
}

variable "facebook_client_id" {
  description = "Facebook OAuth Client ID"
  type        = string
  sensitive   = true
}

variable "facebook_client_secret" {
  description = "Facebook OAuth Client Secret"
  type        = string
  sensitive   = true
}

variable "nextauth_secret" {
  description = "NextAuth Secret key for JWT encryption"
  type        = string
  sensitive   = true
  default     = "Vu4HyE/xL43CrDXUZelE/jzNsb0fVz8BZmmWmleRXGY="
}

