
provider "mongodbatlas" {
  public_key = var.mongo_atlas_public_key
  private_key  = var.mongo_atlas_private_key
}

# Create a Project
resource "mongodbatlas_project" "atlas-project" {
  org_id = var.atlas_org_id
  name = "${var.project_name}-${var.env}"
}

resource "mongodbatlas_project_ip_access_list" "test" {
  project_id = mongodbatlas_project.atlas-project.id
  cidr_block = "0.0.0.0/0"
  comment    = "ip address for tf acc testing"
}

resource "mongodbatlas_serverless_instance" "test" {
  project_id   = mongodbatlas_project.atlas-project.id
  name         = "${var.project_name}-${var.env}-cluster"

  provider_settings_backing_provider_name = "AWS"
  provider_settings_provider_name = "SERVERLESS"
  provider_settings_region_name = "EU_CENTRAL_1"
  continuous_backup_enabled = true
}

resource "random_password" "db_user_password" {
  length = 16
  upper = true
  lower = true
  numeric = true
  special = false
}

resource "mongodbatlas_database_user" "test" {
  username           = "${var.project_name}-${var.env}-username"
  password           = random_password.db_user_password.result
  project_id         = mongodbatlas_project.atlas-project.id
  auth_database_name = "admin"
    roles {
        role_name     = "readWriteAnyDatabase"
        database_name = "admin"
    }
}