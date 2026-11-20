@themes @admin
Feature: Theme content templates
  A theme supplies the templates a page can use. The template decides how
  the page is laid out and which display regions it has.

  Background:
    Given I am logged in as an administrator

  Scenario: The default templates give each page its layout
    When I publish a page titled "Two columns" with the template "two_column_SL.cfm"
    And I publish a page titled "One column" with the template "one_column.cfm"
    And I publish a page titled "Blank page" with the template "blank.cfm"
    Then the public page "Two columns" has a sidebar
    And the public page "One column" has no sidebar
    And the public page "One column" has site navigation
    And the public page "Blank page" has no site navigation

  Scenario: A page inherits the template of its parent
    When I publish a page titled "Parent page" with the template "one_column.cfm"
    And I publish a page titled "Child page" under the page "Parent page" without choosing a template
    Then the child page "Child page" of "Parent page" has no sidebar

  Scenario: A custom template of the theme can be applied to a page
    Given the test theme is in the themes folder
    And the site uses the test theme
    Then the page templates offered include "e2e_landing.cfm, one_column.cfm, two_column_SL.cfm"
    When I publish a page titled "Landing page" with the template "e2e_landing.cfm"
    Then the public page "Landing page" is rendered by the custom landing template

  Scenario: Templates of another theme are not offered
    Then the page templates offered do not include "e2e_landing.cfm"
