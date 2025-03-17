locals {
  url = "masat-${var.env}.${data.aws_route53_zone.shiftcrowd_domain.name}"
}

data "aws_route53_zone" "shiftcrowd_domain" {
  name = "shiftcrowd.eu"
  private_zone = false
}

resource "aws_route53_record" "main" {
  zone_id = data.aws_route53_zone.shiftcrowd_domain.zone_id
  name    = local.url
  type    = "A"

  alias {
    name                   = aws_lb.alb.dns_name
    zone_id                = aws_lb.alb.zone_id
    evaluate_target_health = true
  }
}

resource "aws_acm_certificate" "masat_api_cert" {
  domain_name = local.url
  subject_alternative_names = [local.url] # Your custom domain
  validation_method = "DNS"
}

resource "aws_route53_record" "example" {
  for_each = {
    for dvo in aws_acm_certificate.masat_api_cert.domain_validation_options : dvo.domain_name => {
      name   = dvo.resource_record_name
      record = dvo.resource_record_value
      type   = dvo.resource_record_type
    }
  }

  allow_overwrite = true
  name            = each.value.name
  records         = [each.value.record]
  ttl             = 60
  type            = each.value.type
  zone_id         = data.aws_route53_zone.shiftcrowd_domain.zone_id
}

resource "aws_acm_certificate_validation" "example" {
  certificate_arn         = aws_acm_certificate.masat_api_cert.arn
  validation_record_fqdns = [for record in aws_route53_record.example : record.fqdn]
}