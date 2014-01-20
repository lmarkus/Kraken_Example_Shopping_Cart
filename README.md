# Kraken_Example_ShoppingCart
A PayPal-enabled shopping cart built with [KrakenJS](http://www.krakenjs.com)

## Introduction
Hi!
It's time to build a non-trivial application using KrakenJS. Instead of a TO-DO list, let's do something more appropriate for PayPal:

A shopping cart!

In particular, this example will highlight the following things:

* Using the generator to incrementally build an application
* Using the configuration hooks
* Using the configuration files
* Creating custom libraries
* Using middleware
* Using models for our data
* Using MongoDB and Mongoose
* Internationalization with the content bundles
* Using Kraken's built-in security
* Integration with PayPal

This repository was created specifically to hold the example. If you look at the [commit list](https://github.com/lmarkus/Kraken_Example_Shopping_Cart/commits/master), you will see
how the shopping cart was built, step by step.

## Prerequisites
* This example requires that [MongoDB](http://www.mongodb.org/downloads) is installed and running on it's default port.
* You will --of course-- need [Node](http://nodejs.org) (Version >= 0.10.20 preferred)
* The Kraken generator. If you havent yet installed it, simply do: `sudo npm install -g generator-kraken`

## Create the app
Let's create our example app using the generator:

`yo kraken`

Just follow the prompts, and you'll have a plain vanilla app in a few clicks.

```bash
$ yo kraken

     ,'""`.
    / _  _ \
    |(@)(@)|   Release the Kraken!
    )  __  (
   /,'))((`.\
  (( ((  )) ))
   `\ `)(' /'

[?] Application name: Kraken_Example_Shopping_Cart
[?] Description: A non-trivial kraken app
[?] Author: @LennyMarkus
[?] Use RequireJS? No

```
The generator will set up the app and install the dependencies. After it's done, just go into the newly created directory
`cd Kraken_Example_Shopping_Cart`

[<img src='http://upload.wikimedia.org/wikipedia/commons/thumb/2/25/External.svg/600px-External.svg.png' width='12px' height='12px'/>View commit](https://github.com/lmarkus/Kraken_Example_Shopping_Cart/commit/5056913290f6dd034cc03e7e0702f9fd9628503e)

## Adding some custom configuration
Our application will connect to a database, so we need to supply some information such as the host name, and schema to
connect to. Hardcoding these values is a bad idea, so instead we'll use the kraken configuration file: `./config/app.json`.

We'll add the following db credentials to `./config/app.json`:
```json
    "databaseConfig": {
        "host": "localhost",
        "database": "test"
    }
```

This configuration will be parsed by the application on startup using `nconf`. The data will then be accessible within the
application

[<img src='http://upload.wikimedia.org/wikipedia/commons/thumb/2/25/External.svg/600px-External.svg.png' width='12px' height='12px'/>View commit](https://github.com/lmarkus/Kraken_Example_Shopping_Cart/commit/9df01dd05e3b2f34a2dc42438aa4c253d08d93a6)


## Adding a custom library - Database connectivity
For this example we'll be using [Mongoose](http://mongoosejs.com/) to talk to our database, as well as for creating some
object models. But before we can do any of this, we'll need to connect to the database.

Let's create `./lib/database.js`

```javascript
'use strict';
var mongoose = require('mongoose');

var db = function () {
    return {
        config: function (conf) {
            mongoose.connect('mongodb://' + conf.host + '/' + conf.database);
            var db = mongoose.connection;
            db.on('error', console.error.bind(console, 'connection error:'));
            db.once('open', function callback() {
                console.log('db connection open');
            });
        }
    };
};

module.exports = db();
```

This returns an object with a `config` function that will be used to receive the parsed configuration from the previous step.
Using this configuration it will open a connection to the database: `mongoose.connect('mongodb://' + conf.host + '/' + conf.database);`

**Don't forget to add mongoose to the dependencies: ** `npm install --save mongoose`

[<img src='http://upload.wikimedia.org/wikipedia/commons/thumb/2/25/External.svg/600px-External.svg.png' width='12px' height='12px'/>View commit](https://github.com/lmarkus/Kraken_Example_Shopping_Cart/commit/b071b53a802995df252d55cbb7f1080818818ceb)

Next up? Let's invoke it!

## Using Kraken's start-up hooks -- Configuring the database
Kraken gives you the ability to customize how you initialize your application in four different points:
* During configuration.
* Before most middleware has been set.
* After middleware has been set but before the routes have been created.
* After the routes have been created.

We want to set up our database connection during the configuration phase, so we're going to make use of the `app.configure`
method in `./index.js`

First, we'll _require_ our database library `var db = require('./lib/database')`, and then, we'll call it's `config()` method
passing along the `databaseConfig` section of the parsed configuration from the first step.

```javascript
app.configure = function configure(nconf, next) {
    //Configure the database
    db.config(nconf.get('databaseConfig'));
    next(null);
};
```

[<img src='http://upload.wikimedia.org/wikipedia/commons/thumb/2/25/External.svg/600px-External.svg.png' width='12px' height='12px'/>View commit](https://github.com/lmarkus/Kraken_Example_Shopping_Cart/commit/548a5a1ef270475270bbc1342e38f66439e053c7)


In a separate terminal window let's start up mondodb.

```bash
$ mongod
```

You can now give your application a go at this point. If all goes well, a connection to the database will be opened.

```bash
$npm start

Listening on 8000
db connection open
```

## Using custom middleware -- Determining the user's preferred language
Kraken is simply a configuration layer on top of express. To create our own middleware, we simply need to use a function
that takes a request, response and callback parameters. In this case, let's create one that looks for a `language` cookie
and adds this information to the response context.  We will use it later to leverage Kraken's internationalization features.

###Create a new library
We'll create a new library: `./lib/language.js`

```javascript
'use strict';
module.exports = function () {

    return function (req, res, next) {
        //Pick up the language cookie.
        var language = req.cookies.language;

        //Set the locality for this response. The template will pick the appropriate bundle
        if (language) {
            res.locals.context = res.locals.context || {};
            res.locals.context.locality = language;
        }
        next();
    };
};
```

###Use the middleware
But we also need to tell our underlying express server to use this middleware. This time, we're going to use the
`app.requestBeforeRoute` hook so that we set it after the rest of the middleware has been initialized.

On `./index.js` require the library
```
var language = require('./lib/language');
```
and tell out express app to use it
```javascript
app.requestBeforeRoute = function requestBeforeRoute(server) {
    // Fired before routing occurs
    server.use(language());
};
```

[<img src='http://upload.wikimedia.org/wikipedia/commons/thumb/2/25/External.svg/600px-External.svg.png' width='12px' height='12px'/>View commit](https://github.com/lmarkus/Kraken_Example_Shopping_Cart/commit/95b03fca5956d510a6141f983bc22a82ffc21ed2)


###Add a controller ( using the generator )
Finally, we need to add a controller that will allow the user to choose the language. You could manually create the file
and populate it, but instead we'll let the generator do some work for us:

```bash
$yo kraken:controller setLanguage
[?] Respond to XHR requests? No
   create controllers/setLanguage.js
```

[<img src='http://upload.wikimedia.org/wikipedia/commons/thumb/2/25/External.svg/600px-External.svg.png' width='12px' height='12px'/>View commit](https://github.com/lmarkus/Kraken_Example_Shopping_Cart/commit/fcc4c668b59a284e8e5895cf9344ba76bb648299)


This will create a simple controller at `./controllers/setLanguage.js`.  We're going to tweak this controller a bit, and
make it accept a `lang` parameter as part of the path, and turn it into a cookie. After this, it will redirect the user back
to the root of the site.

```javascript
 server.get('/setlanguage/:lang', function (req, res) {

        res.cookie('language', req.param('lang'));
        res.redirect('/');

    });
```
[<img src='http://upload.wikimedia.org/wikipedia/commons/thumb/2/25/External.svg/600px-External.svg.png' width='12px' height='12px'/>View commit](https://github.com/lmarkus/Kraken_Example_Shopping_Cart/commit/b26bcce74f38ffe236fbef91ffb390f85681e3b5)

This is good enough for our basic setup.
Let's add some meat to the site now!

## Using content bundles -- Making your shopping cart multi-lingual
First, we throw in some stylesheets and assets to make our site more visually appealing.
[<img src='http://upload.wikimedia.org/wikipedia/commons/thumb/2/25/External.svg/600px-External.svg.png' width='12px' height='12px'/>View commit](https://github.com/lmarkus/Kraken_Example_Shopping_Cart/commit/a8036267d3784bd57554c9c82a1f22412b2003ec)

Next, let's modify our templates to take advantage of these assets.

Let's start with the master layout, which defines the site header `./public/templates/layouts/master.dust`
We want to add the store name to the header, as well as a simple navigation menu. (We'll add the controllers later)

Next, we're going to create a new content bundle for the master layout: `./locales/US/en/layouts/master.properties`
Content bundles are just regular key=value property files.

In this case, we're going to define four properties for the master layout:

* The store name: `master.storeName=The Kraken Store`
* The navigation menu: `master.buy=Buy our products!` `master.edit=Product Editor` `master.cart=View Cart`

To access these properties in the dust layout, we'll use special dust tags in the form `{@pre type="content" key="<PROPERTY_NAME>"/}`)

```html
<h1>{@pre type="content" key="master.storeName"/}</h1>
        <nav>
            <ul class="nm-np inline">
                <li><a href="/">{@pre type="content" key="master.buy"/}</a></li>
                <li><a href="/products">{@pre type="content" key="master.edit"/}</a></li>
                <li><a href="/cart">{@pre type="content" key="master.cart"/}</a></li>
            </ul>
        </nav>
```
[<img src='http://upload.wikimedia.org/wikipedia/commons/thumb/2/25/External.svg/600px-External.svg.png' width='12px' height='12px'/>View commit](https://github.com/lmarkus/Kraken_Example_Shopping_Cart/commit/b6830abfedb3d28c30622798bd4ae1fca16d6cff)


We will apply the same treatment to our index page by adding a brief introductory paragraph:

First we modify the template: `./public/templates/index.dust`
```html
    <main role="main">
        <p>{@pre type="content" key="index.greeting"/}</p>
        <div class="products">
        </div>
    </main>
```

And add some content to it's bundle
`./locales/US/en/index.properties`
```
index.greeting=Welcome to the Kraken Store. Your one-stop-shop for kraken merchandise.
index.addToCart=Add to cart
```
[<img src='http://upload.wikimedia.org/wikipedia/commons/thumb/2/25/External.svg/600px-External.svg.png' width='12px' height='12px'/>View commit](https://github.com/lmarkus/Kraken_Example_Shopping_Cart/commit/05a32c19eb1458707108314e0559ba500bda41dc)

Start the application `npm start` and give it a [quick spin](http://localhost:8080). Looking nice, right?

###Learning a new language!
We also want to give the user the option to switch between English and Spanish, so we'll add two country flags, hyperlinked
to the `/setLanguage` controller.

So how do you use a new language? You create a new content bundle!

Let's use the generator to make our life easier: `yo kraken:locale file COUNTRY language` will create a new content bundle
for the specified file and locality.

```bash
$ yo kraken:locale index ES es
   create locales/ES/es/index.properties
```

Let's edit it, and add the Spanish content for our properties:
```
index.greeting=Bienvenido a la tienda Kraken Store. Su destino para mercancía Kraken.
index.addToCart=Agregar
```

The same goes for the master layout:
Create `locales/ES/es/layouts/master.properties`
and populate it:
```
master.storeName=La Tienda Kraken
master.buy=Compre nuestros productos!
master.edit=Editor de Productos
master.cart=Ver carrito
```

[<img src='http://upload.wikimedia.org/wikipedia/commons/thumb/2/25/External.svg/600px-External.svg.png' width='12px' height='12px'/>View commit](https://github.com/lmarkus/Kraken_Example_Shopping_Cart/commit/00c481794c77bd7cb116571f67342f9f8262eebf)

Start your application again, load it in the browser and click on the language flags. Can you say Hola Kraken?

## Using Models -- Saving and retrieving products from the database
Time to add some products!
We want to create a web interface for adding and deleting products from our system.

Before we do that, let's use Mongoose to create a model that represents a Product, and add some functionality to it.

### The model
Let's create `./models/productModel.js`.
Our model will have two parameters `name` and `price`. In addition, it will have two functions `whatAmI()` which is just
a fancy toString, and `prettyPrice` which will return the price in a nice format.

```javascript
'use strict';

var mongoose = require('mongoose');

var productModel = function () {

    //Define a super simple schema for our products.
    var productSchema = mongoose.Schema({
        name: String,
        price: Number
    });

    //Verbose toString method
    productSchema.methods.whatAmI = function () {
        var greeting = this.name ?
            'Hello, I\'m a ' + this.name + ' and I\'m worth $' + this.price
            : 'I don\'t have a name :(';
        console.log(greeting);
    };

    //Format the price of the product to show a dollar sign, and two decimal places
    productSchema.methods.prettyPrice = function () {
        return '$' + this.price.toFixed(2);
    };

    return mongoose.model('Product', productSchema);

};

module.exports = new productModel();
```

[<img src='http://upload.wikimedia.org/wikipedia/commons/thumb/2/25/External.svg/600px-External.svg.png' width='12px' height='12px'/>View commit](https://github.com/lmarkus/Kraken_Example_Shopping_Cart/commit/f37f1f66de657e2d57778310bfad025ea3fe33ae)

Now that we have a model, let's create a CRUD controller for the product editor.
On this example, we'll only focus on the Creation, Retrieval and Deletion of products.

### The controller

We want to make this controller RESTful, so we'll be using post, get and delete functions to implement these operations.
To keep the product simple, we'll just use web forms to post the information, so we're going to use express' methodOverride() middleware ([Documentation](http://www.senchalabs.org/connect/methodOverride.html))
to accept a `_method` parameter along with our requests.

In `./index.js` we're going to require express
```javascript
    express = require('express'),
```
and use the middleware under the `app.requestBeforeRoute` hook
```javascript
    server.use(express.methodOverride());
```
[<img src='http://upload.wikimedia.org/wikipedia/commons/thumb/2/25/External.svg/600px-External.svg.png' width='12px' height='12px'/>View commit](https://github.com/lmarkus/Kraken_Example_Shopping_Cart/commit/db2b8fe2b08db65410c3beae2272fb296507c5fa)


Let's create the controller `./controllers/products.js` (You should know how to use the generator by now)

The controller should require our product model

```javascript
var Product = require('../models/productModel');
```

#### Retrieving products
Let's start with the GET method.  This will be used to retrieve a list of products, to be rendered by our view.
Mongoose gives you a built-in `find` [function](http://mongoosejs.com/docs/api.html#model_Model.find) for retrieving all
instances of the model from the database. Once retrieved, we'll just pass them along to the model for rendering.

```javascript
    server.get('/products', function (req, res) {

        Product.find(function (err, prods) {
            if (err) {
                console.log(err);
            }

            var model =
            {
                products: prods
            };
            res.render('products', model);
        });

    });
```

#### Adding products
We'll use POST for adding a product to the database.  Again, we'll rely on the functionality provided by Mongoose.
We'll retrieve the `name` and `price` from the incoming request, create an instance of the product, and save it to the database
using the built-in [save function](http://mongoosejs.com/docs/api.html#model_Model-save):
```javascript
    server.post('/products', function (req, res) {
        //Retrieve data
        var name = req.body.name && req.body.name.trim();
        var price = parseFloat(req.body.price, 10);

        //Some very lightweight input checking
        if (name === '' || isNaN(price)) {
            res.redirect('/products#BadInput');
            return;
        }

        //Create a new instance of a Product
        var newProduct = new Product({name: name, price: price});

        //Show it in console for educational purposes...
        newProduct.whatAmI();

        //Save it to the database.
        newProduct.save(function (err) {
            if (err) {
                console.log('save error', err);
            }

            res.redirect('/products');
        });
    });
```
**IMPORTANT NOTE: Using floating point for currency is bad! We're just trying to keep this example simple. Please read the final code for more information**

#### Deleting a product
For delete we'll use... well, DELETE. We'll use the ID of the product to find and delete it, again relying on Mongoose
```javascript
    server.delete('/products', function (req, res) {
        Product.remove({_id: req.body.item_id}, function (err) {
            if (err) {
                console.log('Remove error: ', err);
            }
            res.redirect('/products');
        });
    });
```

And that's it for our controller!
[<img src='http://upload.wikimedia.org/wikipedia/commons/thumb/2/25/External.svg/600px-External.svg.png' width='12px' height='12px'/>View commit](https://github.com/lmarkus/Kraken_Example_Shopping_Cart/commit/f8e91c2724c26e4195d8e117a6f8a96a0e27e542)
[<img src='http://upload.wikimedia.org/wikipedia/commons/thumb/2/25/External.svg/600px-External.svg.png' width='12px' height='12px'/>Amendment 1:](https://github.com/lmarkus/Kraken_Example_Shopping_Cart/commit/f3024c4f4a93e049ec981de4bbca7a607a86ca32)


### The view
Let's create a template that will allow you to use the newly minted controller. It will have a section for adding a new
product, and it will list all the existing products, allowing for their removal.
Use the generator to create a new template:
```bash
$ yo kraken:template products
   create public/templates/products.dust
```

First the create form:
```html
<form method="POST" action="/products">
    <input name="name" placeholder="Product Name"><br>
    <input name="price" placeholder="Price"><br>
    <input type="hidden" name="_csrf" value="{_csrf}">
    <input type="submit" value="Save">
</form>
```
#### About Cross Site Request Forgery
----------
If you look above you'll see the following hidden attribute `<input type="hidden" name="_csrf" value="{_csrf}">`

As a default security measure, Kraken makes use of csrf tokens in all request.  Whenever you make any request that will modify
data on the server (POST, PUT, DELETE, etc), you will need to include this token in the body of the request. Otherwise you will
receive a 403 Unauthorized response.  This functionality is provided by the [Lusca](http://github.com/paypal/lusca) security module.
It can be disabled via configuration if desired (`./config/middleware.json` -> `middleware.appsec.csrf=false`), but you should
understand [why it's important to keep it on](https://www.owasp.org/index.php/Cross-Site_Request_Forgery_%28CSRF%29)

----------

Second, the list of products, which also features a DELETE button (with the csrf token, of course).
Note that even though we are using the `POST` method in the form, there is a hidden `_method` attribute set to `DELETE`.
The `methodOverride()` middleware will use this to properly route to the delete function in the controller.
```html
{?products}
    <fieldset>
        <legend>Product List</legend>
        <ul class="nm-np inline">
            {#products}
                <li>
                    <form method="POST" action="/products">
                        <input type="hidden" name="item_id" value="{.id}">

                        <h3 class="nm-np">{.name}</h3>
                        <h4 class="nm-np">{.prettyPrice}</h4>
                        <h5 class="nm-np tiny">ID: {.id}</h5>

                        <input type="submit" value="Delete">
                        <!--If we don't at the Cross-Site Request Forgey token, this POST will be rejected-->
                        <input type="hidden" name="_csrf" value="{_csrf}">
                        <input type="hidden" name="_method" value="DELETE">
                    </form>
                </li>
            {/products}
        </ul>
    </fieldset>
{:else}
    There are no products :(
{/products}
```
This will check to see if any products are present, and if they are, it will iterate over the list, creating a form for
manipulating each product.

[<img src='http://upload.wikimedia.org/wikipedia/commons/thumb/2/25/External.svg/600px-External.svg.png' width='12px' height='12px'/>View commit](https://github.com/lmarkus/Kraken_Example_Shopping_Cart/commit/e9037fceeeb43dfffbae783442f398376b71ca35)

Fire up the server, visit `/products` and add a few products.

## Making a simple cart
Now that we have all the pieces in place, we can actually build the shopping cart.

### The items view
Let's use the index page to display all the avalable products, and give the user the option to add them to a shopping cart:
`./public/templates/index.dust`
```html
<ul class="nm-np inline">
    {#products}
        <li>
            <form method="POST" action="cart">
                <input type="hidden" name="item_id" value="{.id}">

                <h3 class="nm-np">{.name}</h3>
                <h4 class="nm-np">{.prettyPrice}</h4>
                <input type="submit" value="{@pre type="content" key="index.addToCart"/}">
                <!--If we don't add the Cross-Site Request Forgery token, this POST will be rejected-->
                <input type="hidden" name="_csrf" value="{_csrf}">
            </form>
        </li>
    {:else}
        <li>There are no products :(<br>You should <a href="/products">add some</a></li>
    {/products}
</ul>
```
It's very similar to the previous product list we built.
Notice two things:
* Use of the csrf token
* Use of a content bundle for the label of the button

[<img src='http://upload.wikimedia.org/wikipedia/commons/thumb/2/25/External.svg/600px-External.svg.png' width='12px' height='12px'/>View commit](https://github.com/lmarkus/Kraken_Example_Shopping_Cart/commit/479a9747443806ac13fa16e9c02eef9c83754135)


### The Controllers
Let's modify `./controllers/index.js` to serve a list of products to the main page. This is pretty straightforward as
you've seen before. Retrieve the items from the database, and pass them to the template:
```javascript
server.get('/', function (req, res) {

    Product.find(function (err, prods) {
        if (err) {
            console.log(err);
        }

        var model =
        {
            products: prods
        };

        res.render('index', model);
    });
});
```
[<img src='http://upload.wikimedia.org/wikipedia/commons/thumb/2/25/External.svg/600px-External.svg.png' width='12px' height='12px'/>View commit](https://github.com/lmarkus/Kraken_Example_Shopping_Cart/commit/479a9747443806ac13fa16e9c02eef9c83754135)

Now, when a customer adds an item to the shopping cart, we want to do two things.
1 Put it in the session memory store.
2 Display what's in the cart.

We need a `cart` controller for this.

Once again we're going to use the generator, but this time, we'll create a controller, template and even a content bundle in a single shot:
```bash
$ yo kraken:page cart
   invoke   kraken:controller:/usr/local/lib/node_modules/generator-kraken/page/index.js
[?] Respond to XHR requests? No
   create     controllers/cart.js
   invoke   kraken:model:/usr/local/lib/node_modules/generator-kraken/page/index.js
   create     models/cart.js
   invoke   kraken:template:/usr/local/lib/node_modules/generator-kraken/page/index.js
   create     public/templates/cart.dust
   invoke   kraken:locale:/usr/local/lib/node_modules/generator-kraken/page/index.js
   create     locales/US/en/cart.properties
```
Note: We won't be modifying the content bundle for this section. That's left as an excercise for the reader.

The `./controllers/cart.js` controller will have two functions.

`POST` will accept an item into the shopping cart by putting it in memory. If it's already in the cart, it will increase the quantity by one.
```javascript
 server.post('/cart', function (req, res) {

        //Load (or initialize) the cart
        req.session.cart = req.session.cart || {};
        var cart = req.session.cart;

        //Read the incoming product data
        var id = req.param('item_id');

        //Locate the product to be added
        Product.findById(id, function (err, prod) {
            if (err) {
                console.log('Error adding product to cart: ', err);
                res.redirect('/cart');
                return;
            }

            //Add or increase the product quantity in the shopping cart.
            if (cart[id]) {
                cart[id].qty++;
            }
            else {
                cart[id] = {
                    name: prod.name,
                    price: prod.price,
                    prettyPrice: prod.prettyPrice(),
                    qty: 1
                };
            }

            //Display the cart for the user
            res.redirect('/cart');

        });
    });
```

`GET` will retrieve the cart from the session memory, totalize the items, and present it for display
```javascript
    server.get('/cart', function (req, res) {

        //Retrieve the shopping cart from memory
        var cart = req.session.cart,
            displayCart = {items: [], total: 0},
            total = 0;

        if (!cart) {
            res.render('result', {result: 'Your cart is empty!'});
            return;
        }

        //Ready the products for display
        for (var item in cart) {
            displayCart.items.push(cart[item]);
            total += (cart[item].qty * cart[item].price);
        }
        req.session.total = displayCart.total = total.toFixed(2);

        var model =
        {
            cart: displayCart
        };

        res.render('cart', model);
    });
```

The `./public/templates/cart.dust` view, will display the items, and also present the customer with a checkout form where they can
enter their credit card information. (We've prefilled it with some values to make testing easier)
```html
<ul class="nm-np inline">
    {#cart.items}
        <li>
            <h3 class="nm-np">{.qty} x {.name}</h3>
            <h4 class="nm-np">Price: {.prettyPrice} ea.</h4>
        </li>
    {/cart.items}
</ul>

...
<h3>Total: ${cart.total}</h3>
<form method="post" action="/pay">
    <input name="cc" placeholder="CC #" value="4532649989162709" maxlength="16"><br>
    <input name="expMonth" placeholder="MM" value="12" maxlength="2" size="2">
    <input name="expYear" placeholder="YYYY" value="2018" maxlength="4" size="4">
    <input name="cvv" placeholder="cvv" value="111" maxlength="4" size="4"><br>
    <input name="firstName" value="Ash" placeholder="First Name">
    <input name="lastName" value="Williams" placeholder="Last Name"><br>
    <input type="hidden" name="_csrf" value="{_csrf}">
    <input type="submit" value="Complete Purchase">
</form>
```

[<img src='http://upload.wikimedia.org/wikipedia/commons/thumb/2/25/External.svg/600px-External.svg.png' width='12px' height='12px'/>View commit](https://github.com/lmarkus/Kraken_Example_Shopping_Cart/commit/5aa586fc54f7e44ad1e90771514e633f15225f9c)

All the pieces are in place. There's just one step left: **Money!**

##Integrating with PayPal
We'll be using PayPal's [REST SDK for Node](https://github.com/paypal/rest-api-sdk-nodejs) to give our cart the ability
to actually charge the customer. Please read through the documentation to understand how this API works. We will be connecting
to PayPal's sandbox environment, so this API call will not result in credit cards being charged. We recommend that you use a [randomly generated](http://www.darkcoding.net/credit-card-numbers/) credit card number for testing.
Simply use any expiration date in the future.

----------
####Note about security and encryption.
This example shows you how to take credit cards, but does not address security. If you plan to use this code in production, please be sure to make your system [PCI compliant](https://www.pcisecuritystandards.org) to ensure the safety of your customers.

----------


First, let's install the SDK, and save it in our `package.json` file:
`$ npm install --save paypal-rest-sdk`

The PayPal API requires credentials in order to use it.  Let's add them to our configuration file:
`./config/app.json`
```json
    "paypalConfig": {
        "host": "api.sandbox.paypal.com",
        "port": "",
        "client_id": "EBWKjlELKMYqRNQ6sYvFo64FtaRLRR5BdHEESmha49TM",
        "client_secret": "EO422dn3gQLgDbuwqTjzrFgFtaRLRR5BdHEESmha49TM"
    }
```

We should also tell the SDK to configure itself during the application startup. We can do this in `./index.js` under `app.configure`
```javascript
...

paypal = require('paypal-rest-sdk'),

...

app.configure = function configure(nconf, next) {
...
    //Configure the PayPal SDK
    paypal.configure(nconf.get('paypalConfig'));
    next(null);
};
```


Next, we'll create `./controllers/pay.js`, which will receive the credit card information from the checkout step. This will invoke
the PayPal API, and charge the customer for their purchase.

It is shown here in its entirety
```javascript
'use strict';
var paypal = require('paypal-rest-sdk');

module.exports = function (server) {

    /**
     * Send information to PayPal
     */
    server.post('/pay', function (req, res) {

        //Read the incoming product data
        var cc = req.param('cc'),
            firstName = req.param('firstName'),
            lastName = req.param('lastName'),
            expMonth = req.param('expMonth'),
            expYear = req.param('expYear'),
            cvv = req.param('cvv');

        //Ready the payment information to pass to the PayPal library
        var payment = {
            'intent': 'sale',
            'payer': {
                'payment_method': 'credit_card',
                'funding_instruments': []
            },
            'transactions': []
        };

        // Identify credit card type. Patent pending. Credit cards starting with 3 = amex, 4 = visa, 5 = mc , 6 = discover
        var ccType = (['amex','visa','mastercard','discover'])[parseInt(cc.slice(0,1),10)-3];

        //Set the credit card
        payment.payer.funding_instruments[0] =
        {
            'credit_card': {
                'number': cc,
                'type': ccType,
                'expire_month': expMonth,
                'expire_year': expYear,
                'cvv2': cvv,
                'first_name': firstName,
                'last_name': lastName
            }
        };

        //Set the total to charge the customer
        payment.transactions[0] = {
            amount: {
                total: req.session.total,
                currency: 'USD'
            },
            description: 'Your Kraken Store Purchase'
        };


        //Execute the payment.
        paypal.payment.create(payment, {}, function (err, resp) {
            if (err) {
                console.log(err);
                res.render('result',{result:'Error :('});
                return;
            }

            if (resp) {
                delete req.session.cart;
                delete req.session.displayCart;
                res.render('result',{result:'Success :)'});
            }
        });
    });
};
```
After the payment has been completed, we'll pass it to a very simple template `./public/templates/result.dust` that shows
the final status of the operation.

[<img src='http://upload.wikimedia.org/wikipedia/commons/thumb/2/25/External.svg/600px-External.svg.png' width='12px' height='12px'/>View commit](https://github.com/lmarkus/Kraken_Example_Shopping_Cart/commit/9e46ec5aefcb55ef9c40a6f2a2f407e4215bc4fa)

## And you're done!
This is your example.
If you find any typos, errors, bugs or you have suggestions for improvement, please feel free to open an issue, or send your pull requests.


## Notes

* This example uses floating point numbers to represent currency.  This is a bad idea. A better solution should use an arbitrary precision library such as [bignum](https://github.com/justmoon/node-bignum). We chose to go for simplicity in this proof of concept, because some of these libraries can be tricky to install on certain environments.
* Security: If you need to take credit card payments, but don't want to worry about PCI compliance you can use PayPal's checkout. See a running example [here](http://runnable.com/UXgzNO_v2oZyAADG/make-a-payment-with-paypal-api-for-node-js) You could also use a solution like Braintree's [client side encryption](https://www.braintreepayments.com/braintrust/client-side-encryption).
