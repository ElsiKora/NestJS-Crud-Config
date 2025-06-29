# Changelog

All notable changes to this project will be documented in this file.

## [Unreleased]

### Added
- Full encryption support with AES-256-GCM algorithm
- New `set`, `delete`, and `list` methods in `CrudConfigService`
- `CryptoUtility` class for encryption/decryption operations
- `IConfigSetOptions` interface for configuration setting
- Support for selective encryption per configuration value
- Automatic encryption/decryption based on module settings
- Encryption example demonstrating best practices

### Fixed
- Implemented missing decryption functionality in `get` method
- Added proper error handling for encryption/decryption failures

## [1.2.9](https://github.com/ElsiKora/NestJS-AWS-Parameter-Store-Config/compare/v1.2.8...v1.2.9) (2025-03-23)
