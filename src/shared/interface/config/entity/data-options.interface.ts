/**
 * Interface for ConfigData entity options
 */
export interface IConfigEntityDataOptions {
 /**
  * Maximum length for description field (default: 512)
  */
 maxDescriptionLength?: number;

 /**
  * Maximum length for environment field (default: 64)
  */
 maxEnvironmentLength?: number;

 /**
  * Maximum length for name field (default: 128)
  */
 maxNameLength?: number;

 /**
  * Maximum length for value field (default: 8192)
  */
 maxValueLength?: number;

 /**
  * Table name (default: "config_data")
  */
 tableName?: string;
}
