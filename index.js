'use strict';

const _ = require('lodash');

class ServerlessCloudWatchLogsTagPlugin {
  constructor(serverless, options) {
    this.serverless = serverless;
    this.options = options || {};

    this.provider = this.serverless.getProvider('aws');
    this.region = this.provider.getRegion();
    this.stage = this.provider.getStage();
    this.tags = this.serverless.service.custom.cloudWatchLogsTags;

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

  getStackResources() {
    const stackName = this.provider.naming.getStackName(this.options.stage);

    return this.provider.request(
      'CloudFormation',
      'describeStackResources',
      { StackName: stackName },
      this.stage,
      this.region,
    );
  }

  tagCloudWatchLogs(data) {
    const cloudWatchResources = _.filter(data.StackResources, { ResourceType: 'AWS::Logs::LogGroup' });

    const promises = _.map(cloudWatchResources, item => {
      return new Promise((resolve, reject) => {
        this.provider.request(
          'CloudWatchLogs',
          'tagLogGroup',
          {
            logGroupName: item.PhysicalResourceId,
            tags: this.tags,
          },
          this.stage,
          this.region,
        ).then(() => {
          resolve(`Tagged LogGroup ${item.LogicalResourceId}`);
        }).catch((err) => {
          reject(err);
        });
      });
    });

    return Promise.all(promises);
  }
}

module.exports = ServerlessCloudWatchLogsTagPlugin;
