'use strict';

const _ = require('lodash');

let _cloudWatchLogsService = null;
let _cloudFormationService = null;

class ServerlessCloudWatchLogsTagPlugin {

  get stackName() {
    return `${this.serverless.service.service}-${this.options.stage}`;
  }

  get logGroupService() {

    if (!_cloudWatchLogsService)
      _cloudWatchLogsService = new this.awsService.sdk.CloudWatchLogs({ region: this.options.region });

    return _cloudWatchLogsService;
  }

  get cloudWatchLogsService() {

    if (!_cloudFormationService)
      _cloudFormationService = new this.awsService.sdk.CloudFormation({ region: this.options.region });

    return _cloudFormationService;
  }

  constructor(serverless, options) {

    this.options = options;
    this.serverless = serverless;
    this.awsService = this.serverless.getProvider('aws');

    this.hooks = {
      'after:deploy:deploy': this.execute.bind(this),
    };
  }

  execute() {
    return this.getStackResources()
      .then(data => this.tagCloudWatchLogs(data))
      .then(data => this.serverless.cli.log(JSON.stringify(data)))
      .catch(err => this.serverless.cli.log(JSON.stringify(err)));
  }

  getStackResources(nextToken) {
    const getData = async (acc = [], nextToken) => {
      const data = await this.cloudWatchLogsService.listStackResources({ StackName: this.stackName, NextToken: nextToken }).promise();
      if (data.NextToken) {
        return getData([...acc, ...data.StackResourceSummaries], data.NextToken);
      } else {
        return [...acc, ...data.StackResourceSummaries];
      }
    }
    return getData();
  }

  tagCloudWatchLogs(data) {
    const cloudWatchResources = _.filter(data, { ResourceType: 'AWS::Logs::LogGroup' });

    const promises = _.map(cloudWatchResources, item => {
      return new Promise((resolve, reject) => {

        const params = {
          logGroupName: item.PhysicalResourceId,
          tags: this.serverless.service.custom.cloudWatchLogsTags
        };

        this.logGroupService.tagLogGroup(params, (err, apiData) => {
          if (err) return reject(err);
          resolve(`Tagged LogGroup ${item.LogicalResourceId}`);
        });
      });
    });

    return Promise.all(promises);
  }
}

module.exports = ServerlessCloudWatchLogsTagPlugin;
