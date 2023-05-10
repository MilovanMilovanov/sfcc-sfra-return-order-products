# sfcc-sfra-return-order-reason

i had to create a process for returning products from an order.

The first template of the process is returnProductsConfig.isml
in which next to every item in the order you have a drop down with reasons to return, that are created as a preference from the busness manager.

After choosing an option for the return and quantity, the customer gets redirected to  the second template i created - returnProductsConfirmation.isml

In which, inside next to the product is the selected reason and quantity for the return, after confirmation. In the business manager Orders, a custom attribute is being updated from a controller, with a JSON with an id, date of return, reason, and quantity.
