#!/bin/bash
set -e

for Script in .docker/localstack/*.sh ; do
    bash "$Script"
done
