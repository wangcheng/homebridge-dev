// Allowed property types - only Boolean, Number, and enums
type PropertyTypes =
  | BooleanConstructor
  | NumberConstructor
  | Record<number | string, number | string>;

// Helper type to determine the result type for a property
type PropertyResultType<T extends PropertyTypes> = T extends BooleanConstructor
  ? boolean
  : T extends NumberConstructor
    ? number
    : T extends Record<number, number | string>
      ? T[keyof T]
      : never;

// Property configuration interface that supports both primitive types and enums
export interface PropertyConfig<TType extends PropertyTypes = PropertyTypes> {
  commandId?: number;
  name: string;
  statusIndex: number;
  type: TType;
}

// Utility type to extract the result object type from property configs
type MapPropertiesToObject<T extends Record<string, PropertyConfig>> = {
  [K in keyof T]: PropertyResultType<T[K]["type"]>;
};

// Main function with proper typing
export function mapArrayToObject<
  const T extends Record<string, PropertyConfig>,
>(values: readonly number[], properties: T): MapPropertiesToObject<T> {
  const result: Record<string, boolean | number> = {};

  for (const [name, prop] of Object.entries(properties)) {
    const value = values[prop.statusIndex];

    if (prop.type === Boolean) {
      // Convert to boolean: 0 = false, non-zero = true
      result[name] = Boolean(value);
    } else if (prop.type === Number) {
      // Keep as number
      result[name] = value;
    } else if (typeof prop.type === "object") {
      // Handle enum types
      result[name] = value;
    }
  }

  return result as MapPropertiesToObject<T>;
}
