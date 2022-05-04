#!/bin/bash

# help
usage() {
  cat <<EOF

Usage: bash $(basename "${BASH_SOURCE[0]}") [options]
Options:
-h, --help            print options
-p, --aws-profile     aws profile [default: default]

EOF
  exit
}

# force exit
kill() {
  local message=$1
  local code=${2-1}
  echo ${message}
  exit ${code}
}

# parse options
parse_options() {
  # default
  aws_region="us-east-1"
  aws_profile="default"

  while :; do
    case "${1-}" in
    -h | --help) usage ;;
    -p | --aws-profile)
      aws_profile="${2-}"
      shift
      ;;
    -?*) kill "unknown option: $1" ;;
    *) break ;;
    esac
    shift
  done

  args=("$@")
  return 0
}
parse_options "$@"

log() {
  local level=$1
  local from=$2
  local message=$3
  local data=$4

  # setup color for output message
  LIGHT_BLUE="\033[0;94m"
  LIGHT_YELLOW="\033[0;93m"
  GRAY="\033[0;90m"
  CYAN="\033[0;36m"
  YELLOW="\033[0;33m"
  GREEN="\033[0;32m"
  RED="\033[0;31m"
  NO_COLOR="\033[0m"

  if [ "${level}" == "error" ]; then
    level="${RED}ERR"
  elif [ "${level}" == "warn" ]; then
    level="${YELLOW}WARN"
  elif [ "${level}" == "debug" ]; then
    level="${GREEN}DBG"
  else
    level="${GREEN}INF"
  fi

  log_message="${GRAY}$(date)${NO_COLOR} ${level}${NO_COLOR} ${LIGHT_BLUE}[$(echo ${from} | tr a-z A-Z)]${NO_COLOR} ${LIGHT_YELLOW}${message}:${NO_COLOR} ${CYAN}${data}${NO_COLOR}"
  echo -e ${log_message}
}

# set script directory
script_dir=$(dirname "$(readlink -f $0)")
# set function directory
function_dir=${script_dir}/..
# check function directory exist
if [ ! -d "${function_dir}" ]; then kill "${function_dir} does not exists"; fi
# function prefix
function_prefix="connext-bridge"
# function
function="meta"
# set function name
function_name="${function_prefix}-${function}"
# set compress file name
zip_name="${function_prefix}-${function}.zip"

# go to function directory
cd ${function_dir}
log "debug" "${function}" "packing" "${zip_name}"
# remove file before pack
rm -f ${function_dir}/${zip_name}*
# update dependencies & pack function
npm install && rm package-lock.json && zip -r ${zip_name} *

# set timeout, memory size
timeout=30
memory_size=128

log "debug" "${function}" "query current function" "${function_name}"
# get existing function
function_name_exist=$(aws lambda get-function \
  --function-name "${function_name}" \
  --region "${aws_region}" \
  --profile "${aws_profile}" \
  | jq ".Configuration.FunctionName" | sed -e 's/^"//' -e 's/"$//')
# check function exist
if [ "${function_name}" == "${function_name_exist}" ]; then
  log "info" "${function}" "update function" "${function_name}"
  # update function to aws lambda
  aws lambda update-function-code \
    --function-name "${function_name}" \
    --zip-file fileb://${function_dir}/${zip_name} \
    --region "${aws_region}" \
    --profile "${aws_profile}"
    # --s3-bucket "${aws_bucket}" \
    # --s3-key "${zip_name}" \
  log "info" "${function}" "update function configuration" "${function_name}"
  # update function configuration to aws lambda
  aws lambda update-function-configuration \
    --function-name "${function_name}" \
    --runtime "nodejs14.x" \
    --handler "index.handler" \
    --timeout ${timeout} \
    --memory-size ${memory_size} \
    --region "${aws_region}" \
    --profile "${aws_profile}"
else
  # create execution role for function
  # set role name
  role_name=${function_name}-lambda
  log "info" "${function}" "create role for function" "${role_name}"
  # set policy
  policy="{ \"Version\": \"2012-10-17\", \"Statement\": [{ \"Effect\": \"Allow\", \"Principal\": { \"Service\": \"lambda.amazonaws.com\" }, \"Action\": \"sts:AssumeRole\" }] }"
  # create execution role
  role_arn=$(aws iam create-role \
    --role-name "${role_name}" \
    --assume-role-policy-document "${policy}" \
    --profile "${aws_profile}" \
    | jq ".Role.Arn" | sed -e 's/^"//' -e 's/"$//')
  # attach role policy
  aws iam attach-role-policy \
    --role-name "${role_name}" \
    --policy-arn "arn:aws:iam::aws:policy/service-role/AWSLambdaBasicExecutionRole" \
    --profile "${aws_profile}"
  # wait for role creation
  sleep 5
  log "info" "${function}" "create function" "${function_name}"
  # create function to aws lambda
  aws lambda create-function \
    --function-name "${function_name}" \
    --runtime "nodejs14.x" \
    --handler "index.handler" \
    --role "${role_arn}" \
    --timeout ${timeout} \
    --memory-size ${memory_size} \
    --zip-file fileb://${function_dir}/${zip_name} \
    --region "${aws_region}" \
    --profile "${aws_profile}"
    # --code "S3Bucket=${aws_bucket},S3Key=${zip_name}" \
fi
# remove file after upload
rm -f ${function_dir}/${zip_name}*

log "info" "${function}" "deploy process" "DONE."