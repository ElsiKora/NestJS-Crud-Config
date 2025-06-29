/**
 * Example showing how to use encryption in NestJS CRUD Config
 * This demonstrates secure storage of sensitive configuration values
 */

import { Module, Injectable, OnModuleInit } from '@nestjs/common';
import { CrudConfigModule, CrudConfigService } from '@elsikora/nestjs-crud-config';

/**
 * Module configuration with encryption enabled
 */
@Module({
    imports: [
        CrudConfigModule.register({
            // Enable encryption for all values by default
            shouldEncryptValues: true,
            
            // Encryption key - in production, load from environment variable or secret manager
            encryptionKey: process.env.CONFIG_ENCRYPTION_KEY || 'your-super-secret-encryption-key-32-chars-long!!',
            
            // Other configuration options
            application: 'secure-app',
            environment: 'production',
            
            entityOptions: {
                tablePrefix: 'secure_',
                configData: {
                    maxValueLength: 32768, // Encrypted values are longer than plain text
                },
            },
            
            cacheOptions: {
                isEnabled: true,
                maxCacheTTL: 300, // 5 minutes
            },
        }),
    ],
})
export class SecureConfigModule {}

/**
 * Service demonstrating encryption usage
 */
@Injectable()
export class SecureConfigService implements OnModuleInit {
    constructor(
        private readonly configService: CrudConfigService,
    ) {}

    async onModuleInit() {
        await this.demonstrateEncryption();
    }

    async demonstrateEncryption() {
        console.log('\n=== Encryption Example ===\n');

        // 1. Store sensitive values with automatic encryption
        await this.configService.set({
            section: 'database',
            name: 'DB_PASSWORD',
            description: 'Database password - automatically encrypted',
        }, 'super-secret-password-123!');

        await this.configService.set({
            section: 'api-keys',
            name: 'STRIPE_SECRET_KEY',
            description: 'Stripe API secret key',
        }, 'sk_live_abcdef123456789');

        // 2. Store non-sensitive value without encryption
        await this.configService.set({
            section: 'general',
            name: 'APP_NAME',
            shouldEncrypt: false, // Override default encryption
            description: 'Application name - not sensitive',
        }, 'My Secure Application');

        console.log('✅ Values stored successfully\n');

        // 3. Retrieve encrypted values (automatically decrypted)
        const dbPassword = await this.configService.get({
            section: 'database',
            name: 'DB_PASSWORD',
            shouldDecrypt: true, // This is the default when encryption is enabled
        });

        console.log('Database password (decrypted):', dbPassword.value);
        console.log('Is encrypted in database:', dbPassword.isEncrypted);

        // 4. Retrieve encrypted value without decryption (see raw encrypted data)
        const encryptedPassword = await this.configService.get({
            section: 'database',
            name: 'DB_PASSWORD',
            shouldDecrypt: false, // Get raw encrypted value
        });

        console.log('\nRaw encrypted value:', encryptedPassword.value.substring(0, 50) + '...');
        console.log('Full encrypted length:', encryptedPassword.value.length);

        // 5. List all values in a section
        const apiKeys = await this.configService.list({
            section: 'api-keys',
        });

        console.log('\nAPI Keys in section:');
        for (const key of apiKeys) {
            console.log(`- ${key.name}: ${key.isEncrypted ? '[ENCRYPTED]' : key.value}`);
        }
    }
}

/**
 * Advanced encryption scenarios
 */
@Injectable()
export class AdvancedEncryptionService {
    constructor(
        private readonly configService: CrudConfigService,
    ) {}

    /**
     * Example: Conditional encryption based on value pattern
     */
    async storeWithConditionalEncryption(name: string, value: string) {
        // Encrypt if value looks like a secret (contains 'key', 'password', 'secret', etc.)
        const sensitivePatterns = /key|password|secret|token|credential/i;
        const shouldEncrypt = sensitivePatterns.test(name.toLowerCase()) || 
                            sensitivePatterns.test(value.toLowerCase());

        await this.configService.set({
            section: 'auto-detect',
            name,
            shouldEncrypt,
            description: shouldEncrypt ? 'Auto-detected as sensitive' : 'Auto-detected as non-sensitive',
        }, value);
    }

    /**
     * Example: Migrate unencrypted values to encrypted
     */
    async migrateToEncryption(section: string) {
        const configs = await this.configService.list({ section });
        
        for (const config of configs) {
            if (!config.isEncrypted) {
                // Re-save with encryption enabled
                await this.configService.set({
                    section,
                    name: config.name,
                    shouldEncrypt: true,
                    description: config.description,
                }, config.value);
                
                console.log(`Migrated ${config.name} to encrypted storage`);
            }
        }
    }

    /**
     * Example: Bulk operations with mixed encryption
     */
    async bulkConfigurationSetup() {
        const configurations = [
            // Sensitive configurations - will be encrypted
            { section: 'database', name: 'DB_HOST', value: 'localhost', encrypt: false },
            { section: 'database', name: 'DB_PORT', value: '5432', encrypt: false },
            { section: 'database', name: 'DB_USER', value: 'admin', encrypt: true },
            { section: 'database', name: 'DB_PASSWORD', value: 'secret123', encrypt: true },
            
            // API configurations
            { section: 'external-api', name: 'API_ENDPOINT', value: 'https://api.example.com', encrypt: false },
            { section: 'external-api', name: 'API_KEY', value: 'sk_live_abcdef123', encrypt: true },
            { section: 'external-api', name: 'API_SECRET', value: 'secret_xyz789', encrypt: true },
            
            // Application settings
            { section: 'app', name: 'LOG_LEVEL', value: 'info', encrypt: false },
            { section: 'app', name: 'JWT_SECRET', value: 'jwt-secret-key-here', encrypt: true },
        ];

        for (const config of configurations) {
            await this.configService.set({
                section: config.section,
                name: config.name,
                shouldEncrypt: config.encrypt,
            }, config.value);
        }

        console.log('✅ Bulk configuration completed');
    }
}

/**
 * Security best practices for encryption
 */
export class EncryptionBestPractices {
    /**
     * 1. Encryption Key Management
     * - Never hardcode encryption keys in source code
     * - Use environment variables or secret management services
     * - Rotate encryption keys periodically
     * - Use different keys for different environments
     */
    static getEncryptionKey(): string {
        // Example: Load from AWS Secrets Manager, HashiCorp Vault, etc.
        const key = process.env.CONFIG_ENCRYPTION_KEY;
        
        if (!key) {
            throw new Error('CONFIG_ENCRYPTION_KEY environment variable is required');
        }
        
        if (key.length < 32) {
            throw new Error('Encryption key must be at least 32 characters long');
        }
        
        return key;
    }

    /**
     * 2. Selective Encryption
     * Only encrypt sensitive data to optimize performance
     */
    static shouldEncryptValue(name: string, value: string): boolean {
        const alwaysEncrypt = [
            'password', 'secret', 'key', 'token', 
            'credential', 'private', 'auth'
        ];
        
        const neverEncrypt = [
            'host', 'port', 'url', 'endpoint', 
            'timeout', 'level', 'mode'
        ];
        
        const lowerName = name.toLowerCase();
        
        // Check if should always encrypt
        if (alwaysEncrypt.some(keyword => lowerName.includes(keyword))) {
            return true;
        }
        
        // Check if should never encrypt
        if (neverEncrypt.some(keyword => lowerName.includes(keyword))) {
            return false;
        }
        
        // Default to not encrypting
        return false;
    }

    /**
     * 3. Audit Trail
     * Log encryption/decryption operations for security auditing
     */
    static logEncryptionOperation(operation: 'encrypt' | 'decrypt', configName: string) {
        // In production, send to secure audit log
        console.log(`[AUDIT] ${new Date().toISOString()} - ${operation.toUpperCase()} operation on config: ${configName}`);
    }
}

/**
 * Example: Using with different encryption keys per environment
 */
@Module({
    imports: [
        CrudConfigModule.registerAsync({
            useFactory: () => {
                const environment = process.env.NODE_ENV || 'development';
                
                return {
                    shouldEncryptValues: environment === 'production',
                    encryptionKey: EncryptionBestPractices.getEncryptionKey(),
                    application: 'multi-env-app',
                    environment,
                    
                    entityOptions: {
                        tablePrefix: `${environment}_`,
                    },
                };
            },
        }),
    ],
})
export class MultiEnvironmentConfigModule {}

// All classes are already exported above 