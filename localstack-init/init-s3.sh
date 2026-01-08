#!/bin/bash
# Create S3 bucket for local development
awslocal s3 mb s3://letterbundle-images
echo "Created S3 bucket: letterbundle-images"
