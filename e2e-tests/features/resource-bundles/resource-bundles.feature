@resource-bundles @admin
Feature: Resource bundles
  Themes keep their texts in resource bundles, one file per language. Masa
  uses the bundle of the site's language, falls back to English for a key
  the language does not have, and does not fail on a key nobody defined.

  Background:
    Given I am logged in as an administrator
    And the test theme has resource bundles in English and Dutch
    And the site uses the test theme

  Scenario: The theme shows its text from the English bundle
    Then the footer of the public site greets with the English bundle text

  Scenario: The bundle of the site's language is used
    When I set the site locale to "Dutch"
    Then the footer of the public site greets with the Dutch bundle text

  Scenario: A key the language does not have falls back to English
    When I set the site locale to "Dutch"
    Then the footer of the public site shows the English-only text

  Scenario: A key that no bundle has does not break the site
    Then the public site works although the theme asks for a key that no bundle has
