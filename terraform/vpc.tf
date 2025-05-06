data "aws_availability_zones" "available" {}

locals {
  azs      = slice(data.aws_availability_zones.available.names, 0, 3)
  private_subnets = ["10.0.1.0/24", "10.0.2.0/24", "10.0.3.0/24"]
  public_subnets  = ["10.0.101.0/24", "10.0.102.0/24", "10.0.103.0/24"]
}

# create vpc
resource "aws_vpc" "this" {
  cidr_block           = var.cidr
  instance_tenancy     = "default"
  enable_dns_hostnames = true

  tags = {
    Name = "${var.project_name}-${var.env}-vpc"
  }
}

################################################################################
# Publiс Subnets
################################################################################
resource "aws_subnet" "public" {
  count = length(local.azs)

  vpc_id                  = aws_vpc.this.id
  availability_zone                              = length(regexall("^[a-z]{2}-", local.azs[count.index])) > 0 ? local.azs[count.index] : null
  cidr_block = concat(local.public_subnets, [""])[count.index]

  tags = {
    Name = "${var.project_name}-${var.env}-public-subnet-${local.azs[count.index]}"
  }
}


# create route table and add public route
resource "aws_route_table" "public" {
  vpc_id = aws_vpc.this.id

  tags = {
    Name = "${var.project_name}-${var.env}-public-route-table"
  }
}

# associate public subnets to "public route table"
resource "aws_route_table_association" "public" {
  count = length(local.public_subnets)
  subnet_id      = aws_subnet.public[count.index].id
  route_table_id = aws_route_table.public.id
}

resource "aws_route" "public_internet_gateway" {
  route_table_id         = aws_route_table.public.id
  destination_cidr_block = "0.0.0.0/0"
  gateway_id             = aws_internet_gateway.this.id

  timeouts {
    create = "5m"
  }
}

################################################################################
# Private Subnets
################################################################################
# create private app subnets
resource "aws_subnet" "private_app" {
  count = length(local.azs)

  vpc_id                  = aws_vpc.this.id
  availability_zone                              = length(regexall("^[a-z]{2}-", local.azs[count.index])) > 0 ? local.azs[count.index] : null
  availability_zone_id                           = length(regexall("^[a-z]{2}-", local.azs[count.index])) == 0 ? local.azs[count.index] : null
  cidr_block = concat(local.private_subnets, [""])[count.index]
  map_public_ip_on_launch = false

  tags = {
    Name = "${var.project_name}-${var.env}-private-subnet-${local.azs[count.index]}"
  }
}

resource "aws_route_table" "private" {
  vpc_id = aws_vpc.this.id

  tags = {
    Name = "${var.project_name}-${var.env}private-route-table"
  }
}

# resource "aws_route" "private_nat_gateway" {
#   route_table_id         = aws_route_table.private.id
#   destination_cidr_block = "0.0.0.0/0"
#   nat_gateway_id         = aws_nat_gateway.this.id
#
#   timeouts {
#     create = "5m"
#   }
# }

resource "aws_route_table_association" "private_app_subnets" {
  count = length(local.azs)

  route_table_id = aws_route_table.private.id
  subnet_id      = aws_subnet.private_app[count.index].id
}

################################################################################
# Internet Gateway
################################################################################
# create internet gateway and attach it to vpc
resource "aws_internet_gateway" "this" {
  vpc_id = aws_vpc.this.id

  tags = {
    Name = "${var.project_name}-igw"
  }
}










################################################################################
# NAT Gateway
################################################################################

# create elastic ips. These eip will be used for the nat-gateways in the public subnets
resource "aws_eip" "this" {
  depends_on = [aws_internet_gateway.this]
  domain = "vpc"

  tags = {
    Name = "${var.project_name}-${var.env}-nat-gateway-eip"
  }
}

resource "aws_nat_gateway" "this" {
  allocation_id = aws_eip.this.id
  subnet_id     = aws_subnet.public[0].id

  tags = {
    Name = "${var.project_name}-${var.env}-nat-gateway"
  }

  # To ensure proper ordering, it is recommended to add an explicit dependency
  # on the Internet Gateway for the VPC.
  depends_on = [aws_internet_gateway.this]
}
