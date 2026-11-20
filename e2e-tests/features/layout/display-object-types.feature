@layout @admin
Feature: Display object types
  Each default display object can be added to a page and is rendered on the public site.

  Background:
    Given I am logged in as an administrator
    And a page titled "Objects page" is published

  Scenario Outline: Adding the <object> display object
    When I open the page "Objects page" for inline editing
    And I add the "<object>" display object
    And I publish from the inline editor
    Then the public page "Objects page" shows the display objects "<object>"

    Examples:
      | object         |
      | Button         |
      | Collection     |
      | Container      |
      | Call to Action |
      | Embed          |
      | Form           |
      | Image          |
      | Info           |
      | Media          |
      | Navigation     |
      | Site Search    |
      | Text           |
