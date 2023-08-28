import * as changeCase from "change-case";

export class NameCase {
  input: string;

  /**
   * A utility class for transforming strings into different cases.
   * Useful for various scaffolding activities: file naming, variable naming, etc.
   * @param input An input string.
   */
  constructor(input: string) {
    this.input = input;
  }

  /**
   * The component name with no spaces, and each subsequent word capitalized.
   * For example: "testStringNumberOne".
   */
  get camel() {
    return changeCase.camelCase(this.input);
  }

  /**
   * The component name with every word capitalized, and spaces between words.
   * For example: "Test String Number One".
   */
  get capital() {
    return changeCase.capitalCase(this.input);
  }

  /**
   * The component name in all uppercase, with underscores between words.
   * For example: "TEST_STRING_NUMBER_ONE".
   */
  get constant() {
    return changeCase.constantCase(this.input);
  }

  /**
   * The component name in all lowercase, with periods between words.
   * For example: "test.string.number.one".
   */
  get dot() {
    return changeCase.dotCase(this.input);
  }

  /**
   * The component name with each word capitalized, and dashes between words.
   * For example: "Test-String-Number-One".
   */
  get header() {
    return changeCase.headerCase(this.input);
  }

  /**
   * The component name in all lowercase, with spaces between words.
   * For example: "test string number one".
   */
  get none() {
    return changeCase.noCase(this.input);
  }

  /**
   * The component name in all lowercase, with dashes between words.
   * For example: "test-string-number-one".
   */
  get param() {
    return changeCase.paramCase(this.input);
  }

  /**
   * The component name with every word capitalized, and nothing between words.
   * For example: "TestStringNumberOne".
   */
  get pascal() {
    return changeCase.pascalCase(this.input);
  }

  /**
   * The component name in all lowercase, with slashes between words.
   * For example: "test/string/number/one".
   */
  get path() {
    return changeCase.pathCase(this.input);
  }

  /**
   * The component name with spaces between words, the first word capitalized, and other words lowercase.
   * For example: "Test string number one".
   */
  get sentence() {
    return changeCase.sentenceCase(this.input);
  }

  /**
   * The component name in all lowercase, with underscores between words.
   * For example: "test_string_number_one".
   */
  get snake() {
    return changeCase.snakeCase(this.input);
  }
}
