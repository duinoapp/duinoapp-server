// Why does this exist? without a NAT Gateway, our lambda has no internet
// but leaving a NAT Gateway on all the time costs ~ $40/month
// Thanks Bezos
const fs = require('fs');
const AWS = require('aws-sdk');
const YAML = require('yaml');

const sls = YAML.parse(fs.readFileSync(`${__dirname}/../sls-config.yml`, 'utf-8'));

const cloudformation = new AWS.CloudFormation({
  apiVersion: '2010-05-15',
  region: sls.custom.region,
});

const template = `
Parameters:
  VpcId:
    Description: ID of the VPC we are adding the NAT to
    Type: String
  PrivateSubnetId:
    Description: ID of the Private Subnet we are routing to the NAT
    Type: String
  PublicSubnetCIDR:
    Description: Please enter the IP range (CIDR notation) for the public subnet in the first Availability Zone
    Type: String
    Default: 172.31.128.0/24
Resources:

  PublicSubnet:
    Type: AWS::EC2::Subnet
    Properties:
      VpcId: !Ref VpcId
      AvailabilityZone: !Select [ 0, !GetAZs '' ]
      CidrBlock: !Ref PublicSubnetCIDR
      MapPublicIpOnLaunch: true

  EIP:
    Type: 'AWS::EC2::EIP'
    Properties:
      Domain: vpc
  NatGateway:
    Type: 'AWS::EC2::NatGateway'
    Properties:
      AllocationId: !GetAtt 'EIP.AllocationId'
      SubnetId: !Ref PublicSubnet
  PrivateRouteTable:
    Type: AWS::EC2::RouteTable
    Properties:
      VpcId: !Ref VpcId
  PrivateRoute:
    Type: 'AWS::EC2::Route'
    Properties:
      RouteTableId: !Ref PrivateRouteTable
      DestinationCidrBlock: '0.0.0.0/0'
      NatGatewayId: !Ref NatGateway
  PrivateSubnetRouteTableAssociation:
    Type: AWS::EC2::SubnetRouteTableAssociation
    Properties:
      RouteTableId: !Ref PrivateRouteTable
      SubnetId: !Ref PrivateSubnetId
`;

const stackName = 'duinoapp-vpc-lambda-nat';

const status = () => new Promise((resolve, reject) => {
  cloudformation.describeStacks({
    StackName: stackName,
  }, (err, data) => {
    if (err && err.message.includes('does not exist')) resolve('DELETE_COMPLETE');
    else if (err) reject(err);
    else resolve(data.Stacks[0] ? data.Stacks[0].StackStatus : 'DELETE_COMPLETE');
  });
});

const createStack = () => new Promise((resolve, reject) => {
  cloudformation.createStack({
    StackName: stackName,
    TemplateBody: template,
    Parameters: [
      { ParameterKey: 'VpcId', ParameterValue: sls.custom.vpcId },
      { ParameterKey: 'PrivateSubnetId', ParameterValue: sls.custom.vpc.subnetIds[0] },
      { ParameterKey: 'PublicSubnetCIDR', ParameterValue: sls.custom.publicSubnetCIDR || '172.31.128.0/24' },
    ],
    OnFailure: 'DELETE',
  }, (err, data) => {
    if (err) reject(err);
    else resolve(data);
  });
});

const deleteStack = () => new Promise((resolve, reject) => {
  cloudformation.deleteStack({
    StackName: stackName,
  }, (err, data) => {
    if (err) reject(err);
    else resolve(data);
  });
});

const asyncTimeout = (ms) => new Promise((r) => setTimeout(r, ms));
const waitFor = async (stat) => {
  const s = await status();
  if (s === stat) return;
  if (stat === 'CREATE_COMPLETE' && s.includes('DELETE')) {
    throw new Error('Stack Failed');
  }
  await asyncTimeout(1000);
  await waitFor(stat);
};

const on = async () => {
  switch (await status()) {
  case 'CREATE_IN_PROGRESS':
    return waitFor('CREATE_COMPLETE');
  case 'CREATE_COMPLETE':
    return null;
  case 'DELETE_IN_PROGRESS':
    await waitFor('DELETE_COMPLETE');
    break;
  default:
  }
  await createStack();
  await asyncTimeout(1000);
  return waitFor('CREATE_COMPLETE');
};

const off = async () => {
  switch (await status()) {
  case 'DELETE_IN_PROGRESS':
    return waitFor('DELETE_COMPLETE');
  case 'DELETE_COMPLETE':
    return null;
  case 'CREATE_IN_PROGRESS':
    await waitFor('CREATE_COMPLETE');
    break;
  default:
  }
  await deleteStack();
  await asyncTimeout(1000);
  return waitFor('DELETE_COMPLETE');
};

module.exports = { on, off };
