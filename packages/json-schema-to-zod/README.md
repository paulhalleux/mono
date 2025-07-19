# json-schema-to-zod

A tool to convert JSON Schema to Zod schemas.

## Supported Features

- ✅ `string`: Converting a string JSON Schema type to a Zod string schema.
  - ✅ `minLength`: Minimum length of the string.
  - ✅ `maxLength`: Maximum length of the string.
  - ✅ `pattern`: Regular expression pattern that the string must match.
  - ✅ `format`: Validation based on common formats like `email`, `uri`, etc.
    - ✅ `email`: Validates that the string is a valid email address.
    - ✅ `date`: Validates that the string is a valid date format.
    - ✅ `time`: Validates that the string is a valid time format.
    - ✅ `date-time`: Validates that the string is a valid date-time format.
    - ✅ `uuid`: Validates that the string is a valid UUID.
  - ✅ `enum`: Validates that the string is one of the specified values in the enum.
- ✅ `number` & `integer`: Converting a number JSON Schema type to a Zod number schema.
  - ✅ `minimum`: Minimum value of the number.
  - ✅ `maximum`: Maximum value of the number.
  - ✅ `multipleOf`: Validates that the number is a multiple of the specified value.
  - ✅ `enum`: Validates that the number is one of the specified values in the enum.
- ✅ `boolean`: Converting a boolean JSON Schema type to a Zod boolean schema.
  - ✅ `enum`: Validates that the boolean is one of the specified values in the enum.