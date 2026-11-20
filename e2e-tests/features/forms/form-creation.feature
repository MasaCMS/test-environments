@forms @admin
Feature: Form creation
  Administrators build forms with the Form Builder, show them on a page
  and see the responses in the admin.

  Background:
    Given I am logged in as an administrator

  Scenario: A form with the basic field types shows on a page
    When I start a new form titled "Feedback form"
    And I add these fields to the form:
      | Type          | Label      | Choices                 | Required |
      | Text field    | Your name  |                         | yes      |
      | Text area     | Message    |                         |          |
      | Radio buttons | Colour     | Red, Blue               |          |
      | Checkboxes    | Extras     | Gift wrap, Card         |          |
      | Dropdown      | Country    | Netherlands, Belgium    |          |
      | File upload   | Attachment |                         |          |
    And I publish the form
    And I show the form "Feedback form" on a new page "Feedback"
    And a visitor opens the page "Feedback"
    Then the form shows the fields "Your name, Message, Colour, Extras, Country, Attachment"
    And the field "Your name" is marked as required
    And the field "Colour" offers the choices "Red, Blue"
    And the field "Extras" offers the choices "Gift wrap, Card"
    And the field "Country" offers the choices "Netherlands, Belgium"

  Scenario: A submitted form is stored and shown in the admin
    When I start a new form titled "Order form"
    And I add these fields to the form:
      | Type          | Label     | Choices              | Required |
      | Text field    | Your name |                      | yes      |
      | Text area     | Message   |                      |          |
      | Radio buttons | Colour    | Red, Blue            |          |
      | Checkboxes    | Extras    | Gift wrap, Card      |          |
      | Dropdown      | Country   | Netherlands, Belgium |          |
    And I set the form's confirmation message to "Thanks for your order"
    And I publish the form
    And I show the form "Order form" on a new page "Order"
    And a visitor opens the page "Order"
    And the visitor fills in the form with:
      | Your name | Ada Lovelace         |
      | Message   | Please deliver soon  |
      | Colour    | Blue                 |
      | Country   | Belgium              |
    And the visitor submits the form
    Then the form is accepted with the message "Thanks for your order"
    And the form "Order form" has 1 response in the admin
    And the responses of the form "Order form" include:
      | Your name    | Message             | Colour | Country |
      | Ada Lovelace | Please deliver soon | Blue   | Belgium |

  Scenario: Several checkboxes can be chosen at once
    When I start a new form titled "Extras form"
    And I add these fields to the form:
      | Type       | Label  | Choices                    |
      | Checkboxes | Extras | Gift wrap, Card, Ribbon    |
    And I publish the form
    And I show the form "Extras form" on a new page "Extras"
    And a visitor opens the page "Extras"
    And the visitor fills in the form with:
      | Extras | Gift wrap, Ribbon |
    And the visitor submits the form
    Then the form is accepted
    And the form "Extras form" has 1 response in the admin
    And the responses of the form "Extras form" include:
      | Extras           |
      | Gift wrap,Ribbon |

  Scenario: The submit button label can be changed
    When I start a new form titled "Label form"
    And I add these fields to the form:
      | Type       | Label     |
      | Text field | Your name |
    And I set the form's submit button label to "Send it now"
    And I publish the form
    And I show the form "Label form" on a new page "Label"
    And a visitor opens the page "Label"
    Then the form has a submit button labelled "Send it now"

  Scenario: A file can be uploaded with the form
    When I start a new form titled "Upload form"
    And I add these fields to the form:
      | Type        | Label      |
      | Text field  | Your name  |
      | File upload | Attachment |
    And I publish the form
    And I show the form "Upload form" on a new page "Upload"
    And a visitor opens the page "Upload"
    And the visitor fills in the form with:
      | Your name  | Grace Hopper  |
      | Attachment | test-note.txt |
    And the visitor submits the form
    Then the form is accepted
    And the form "Upload form" has 1 response in the admin
    And the response containing "Grace Hopper" in the form "Upload form" links to the uploaded file "test-note.txt"
