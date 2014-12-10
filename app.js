(function() {
  var tasks = [];

  //modified from http://www.html5rocks.com/en/tutorials/indexeddb/todo/
  var html5rocks = {};
  html5rocks.indexedDB = {};

  html5rocks.indexedDB.db = null;

  html5rocks.indexedDB.open = function() {
    var version = 1;
    var request = indexedDB.open("todos", version);

    // We can only create Object stores in a versionchange transaction.
    request.onupgradeneeded = function(e) {
      var db = e.target.result;

      // A versionchange transaction is started automatically.
      e.target.transaction.onerror = html5rocks.indexedDB.onerror;

      if(db.objectStoreNames.contains("todo")) {
        db.deleteObjectStore("todo");
      }

      var store = db.createObjectStore("todo",
        {keyPath: "timeStamp"});
    };

    request.onsuccess = function(e) {
      html5rocks.indexedDB.db = e.target.result;
      html5rocks.indexedDB.getAllTodoItems();
    };

    request.onerror = html5rocks.indexedDB.onerror;
  };

  html5rocks.indexedDB.getAllTodoItems = function() {
    var db = html5rocks.indexedDB.db;
    var trans = db.transaction(["todo"], "readwrite");
    var store = trans.objectStore("todo");

    // Get everything in the store;
    var keyRange = IDBKeyRange.lowerBound(0);
    var cursorRequest = store.openCursor(keyRange);

    cursorRequest.onsuccess = function(e) {
      var result = e.target.result;
      if(!!result == false)
        return;

      tasks.push(result.value);
      result.continue();
    };

    cursorRequest.onerror = html5rocks.indexedDB.onerror;
  };

  html5rocks.indexedDB.addTodo = function(item) {
    var db = html5rocks.indexedDB.db;
    var trans = db.transaction(["todo"], "readwrite");
    var store = trans.objectStore("todo");
    var getRequest = store.get(item.timeStamp);
    getRequest.onsuccess = function(e) {
      // Already exist, abort adding
      if (e.target.result)
        return;

      var putRequest = store.put(item);
      trans.oncomplete = function(e) {
        // Re-render all the todo's
        //html5rocks.indexedDB.getAllTodoItems();
      };
      putRequest.onerror = function(e) {
        console.log(e.value);
      };
    };
    getRequest.onerror = function(e) {
    }
  };

  html5rocks.indexedDB.deleteTodo = function(id) {
    var db = html5rocks.indexedDB.db;
    var trans = db.transaction(["todo"], "readwrite");
    var store = trans.objectStore("todo");

    var request = store.delete(id);

    trans.oncomplete = function(e) {
      html5rocks.indexedDB.getAllTodoItems();  // Refresh the screen
    };

    request.onerror = function(e) {
      console.log(e);
    };
  };

  Polymer({
    created: function() {
      html5rocks.indexedDB.open();
    },
    ready: function() {
      this.tasks = tasks;
    },
    tasksChanged: function(changes) {
      if (!changes || !changes.length)
        return;
      changes.forEach(function(change) {
        if(change.addedCount > 0) {
          for (var i = 0; i < change.addedCount; ++i)
            html5rocks.indexedDB.addTodo(tasks[change.index + i]);
        }
      });
    }
  });
})();
