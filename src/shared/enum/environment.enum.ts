/**
 * Enum representing different deployment environments.
 */
export enum EEnvironment {
	DOCKER = "docker",
	EC2 = "ec2",
	ECS = "ecs",
	EKS = "eks",
	ELASTIC_BEANSTALK = "elastic-beanstalk",
	HEROKU = "heroku",
	KUBERNETES = "kubernetes",
	LOCAL = "local",
	PRODUCTION = "production",
	STAGING = "staging",
	TEST = "test",
}
