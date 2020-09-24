#!/usr/bin/env bash

set -eu

while getopts ":u:p:" opt; do
    case ${opt} in
        u )
            username=${OPTARG}
            ;;
        p )
            password=${OPTARG}
            ;;
        : )
            echo "invalid option: ${OPTARG} requires an argument" 1>&2
            exit 1
            ;;
    esac
done

if [ -z ${username-} ]
then
    echo "-u must be specified" 1>&2
    exit 1
else
    url="https://version-control.adelaide.edu.au/svn/${username}/2020/s2/edc/prac4/"
fi

if [ -z ${password} ]
then
    echo "-p must be specified" 1>&2
    exit 1
fi

echo "${password}" | svn co --non-interactive --no-auth-cache --username="${username}" --password-from-stdin ${url} .

npm install

npm test
