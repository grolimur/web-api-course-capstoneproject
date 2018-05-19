const express = require('express');
const menusRouter = express.Router();

const sqlite3 = require('sqlite3');
const db = new sqlite3.Database(process.env.TEST_DATABASE || './database.sqlite');

const menuItemsRouter = require('./menu-items.js');
menusRouter.use('/:menuId/menu-item', menuItemsRouter);


menusRouter.param('menusId', (req, res, next, menusId) => {
  const sql = 'SELECT * FROM Menu WHERE Menu.id = $menusId';
  const values = {$menusId: menusId};
  db.get(sql, values, (error, menu) => {
    if (error) {
      next(error);
    } else if (menu) {
      req.menus = menu;
      next();
    } else {
      res.sendStatus(404);
    }
  });
});

// /api/menus GET
menusRouter.get('/', (req, res, next) => {
  db.all('SELECT * FROM Menu', (err, menu) => {
    if (err) {
      next(err);
    } else {
      res.status(200).json({menu: menu});
    }
  });
});

// /api/menus POST
menusRouter.post('/', (req, res, next) => {
  const title = req.body.menu.title;
  if (!title) {
    return res.sendStatus(400);
  }

  const sql = 'INSERT INTO Menu (title) VALUES ($title)';
  const values = {
    $title: title
  };

  db.run(sql, values, function(error) {
    if (error) {
      next(error);
    } else {
      db.get(`SELECT * FROM Menu WHERE Menu.id = ${this.lastID}`,
        (error, menu) => {
          res.status(201).json({menu: menu});
        });
    }
  });
});

// /api/menus/:menuId GET
// ??? If a menu with the supplied menu ID doesn't exist, returns a 404 response
menusRouter.get('/:id', (req, res, next) => {
  res.status(200).json({menu: req.menu});
});

// /api/menus/:menuId PUT
// ??? If a menu with the supplied menu ID doesn't exist, returns a 404 response
menusRouter.put('/:id', (req, res, next) => {
  const title = req.body.menu.title;
  if (!title) {
    return res.sendStatus(400);
  }

  const sql = 'UPDATE Menu SET title = $title WHERE Menu.id = $id';
  const values = {
    $title: title,
    $id: req.params.id
  };

  db.run(sql, values, (error) => {
    if (error) {
      next(error);
    } else {
      db.get(`SELECT * FROM Menu WHERE Menu.id = ${req.params.id}`,
        (error, menu) => {
          res.status(200).json({menu: menu});
        });
    }
  });
});

// /api/menus/:menuId DELETE
// ??? If a menu with the supplied menu ID doesn't exist, returns a 404 response
menusRouter.delete('/:id', (req, res, next) => {
  const menuItemSql = 'SELECT * FROM MenuItem WHERE MenuItem.menu_id = $menusItemsId';
  const menuItemValues = {$menusItemsId: req.params.menusItemsId};
  db.get(menuItemSql, menuItemValues, (error, menuItem) => {
    if (error) {
      next(error);
    } else if (menuItem) {
      res.sendStatus(400);
    } else {
      const deleteSql = 'DELETE FROM Menu WHERE Menu.id = $id';
      const deleteValues = {$id: req.params.id};

      db.run(deleteSql, deleteValues, (error) => {
        if (error) {
          next(error);
        } else {
          res.sendStatus(204);
        }
      });
    }
  });
});


module.exports = menusRouter;
