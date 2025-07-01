/**
 * Interface for ConfigSection entity options
 */
export interface IConfigEntitySectionOptions {
 /**
  * Maximum length for description field (default: 512)
  */
 maxDescriptionLength?: number;

 /**
  * Maximum length for name field (default: 128)
  */
 maxNameLength?: number;

 /**
  * Table name (default: "config_section")
  */
 tableName?: string;
}
