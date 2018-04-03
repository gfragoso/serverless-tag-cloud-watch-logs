# serverless-tag-cloud-watch-logs
Serverless plugin to tag CloudWatchLogs

## Installation

Install the plugin via <a href="https://docs.npmjs.com/cli/install">NPM</a>

```
npm install --save-dev serverless-tag-cloud-watch-logs
```

## Usage

In Serverless template:

```
custom:
  cloudWatchLogsTags:
    TagName1: TagValue1
    TagName2: TagValue2

plugins: 
  - serverless-tag-cloud-watch-logs

```