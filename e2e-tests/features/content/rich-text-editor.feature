@content @admin
Feature: Rich text editor
  The CKEditor body field produces formatted content on the public site.

  Background:
    Given I am logged in as an administrator

  Scenario: Formatting text as bold
    When I start a new page titled "Bold text"
    And I type "Important words" in the body editor
    And I apply "bold" to the body text
    And I publish the page being edited
    Then the page "Bold text" shows "Important words" inside a "strong" element

  Scenario: Creating a bulleted list
    When I start a new page titled "List page"
    And I type "First item" in the body editor
    And I apply "bulletedlist" to the body text
    And I publish the page being edited
    Then the page "List page" shows "First item" inside a "li" element

  Scenario: Entering HTML in the source view
    When I start a new page titled "Source page"
    And I enter this HTML in the body source view:
      """
      <h2>Source heading</h2><p>Paragraph with a <a href="/">link</a>.</p>
      """
    And I publish the page being edited
    Then the page "Source page" shows "Source heading" inside a "h2" element
    And the page "Source page" shows "link" inside a "a" element
