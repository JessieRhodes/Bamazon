var mysql = require("mysql");
var inquirer = require("inquirer");
var Table = require("cli-table2");

//connection to mysql table
var connection = mysql.createConnection({
  host: 'localhost',
  port: '3306',
  user: 'root',
  password: '',
  database: 'Bamazon'
});

//let's user know if connection is not working
connection.connect(function(err) {
  if (err) throw err;
});
//empty array for products
var products = [];

//first function will run displayProducts function to display table to user
var runCustomer = function() {
  displayProducts();
}
//function to display table of items for sale to user
var displayProducts = function() {
  //connecting to my table and using mysql command to target 'products' table
  connection.query("SELECT * FROM products", function (err, result) {

    // console.log(result);
    // console.log(result[0].product_name);
    var table = new Table({
      head: ['ID', 'Product Name', 'Department', "Price", "Quantity in stock" ]
      , colWidths: [10, 20, 20, 10, 10]
    });
    //loops through columns in my sql products table to push values into table in terminal
    for (var i = 0; i < result.length; i++) {
      table.push([result[i].item_id, result[i].product_name, result[i].department_name, result[i].price, result[i].stock_quantity]);
      products.push(result[i].product_name);
    };

    console.log(table.toString());
    //console.log(products);
    //calling function for first prompt for purchase
    initialPrompt();
  }); // end of connection call
} // end of function

var initialPrompt = function() {
    inquirer.prompt([
  {
    name: "product",
    type: "input",
    message: "Hello! Choose a product to purchase",
    validate: function(value) {
      //if input if incorrect or store has less than 1 item left, error message
      if (isNaN(value) === true && products.indexOf(value) !== -1) {
      return true;
      }
      console.log("Sorry, unavaiable");
      return false;
    }
  }, {
    //if input is correct and store has product available
    name: "quantity",
    type: "input",
    message: "Choose a number of items to purchase"
  }]).then(function(answers) {
    //run check function called to tell user the number of items requested is available 
    runCheck(answers.product, answers.quantity);
  }); // end of inquirer prompt
}
//
var runCheck = function(product, quantity) {
  connection.query("SELECT stock_quantity FROM products WHERE ?", {product_name: product}, function (error, result) {
    var availableQuantity = result[0].stock_quantity;
    if (quantity > availableQuantity ) {
      console.log("Sorry, store has insufficient quantity!");
      //anythingElse function prompts user to either purchase more or finish transaction
      anythingElse();
    } else {
      totalCost(product, quantity);
    }
  });
}

var anythingElse = function() {
  inquirer.prompt({
    name: "again",
    type: "input",
    message: "Any other purchases today? (y/n)",
    validate: function(value) {
      if (value === 'y' || value === 'yes' || value === 'n' || value === 'n') {
        return true;
      }
      return false;
    }
  }).then(function(answer) {
    if (answer.again === "y" || answer.again === 'yes') {
      runCustomer();
    } else {
      console.log("Thanks for shopping!");
      connection.end();
    }
  });
}

var totalCost = function(product, quantity) {
  connection.query("SELECT * FROM products WHERE ?", {product_name: product}, function(error, result) {
    var price = result[0].price;
    var updatedQuantity = result[0].stock_quantity - quantity;
    console.log("Ready to checkout! Your total: " + (price * quantity) + " dollars! Thanks!");
    updateProducts(product, updatedQuantity);

    anythingElse();
  });//end of connection
}// end of function

var updateProducts = function(product, updatedQuantity) {
    connection.query("UPDATE products SET ? WHERE ?", [{
    stock_quantity: updatedQuantity
    }, {
    product_name: product
  }], function(err, res) {
    if (err) throw err;
  });
}//end of function

runCustomer();