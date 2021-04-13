let db;
// Create a new db request for budget tracker database
const request = indexedDB.open("budget", 1);

request.onupgradeneeded = function(event) {
   // Uses autoIncremeent for created object store pending
  const db = event.target.result;
  db.createObjectStore("pending", { autoIncrement: true });
};

request.onsuccess = function(event) {
  db = event.target.result;

    // Check app is online before reading db
  if (navigator.onLine) { 
    checkDatabase();
  }
};

request.onerror = function(event) {
  console.log("There is an error! " + event.target.errorCode); //custom error message
};

function saveRecord(record) {
  // Create a transaction on pending db with readwrite access
  const transaction = db.transaction(["pending"], "readwrite");
  // Access pending object store
  const store = transaction.objectStore("pending");
  // Add record to store
  store.add(record);
}

function checkDatabase() {
  // Open a transaction 
  const transaction = db.transaction(["pending"], "readwrite");
  // Access pending object store
  const store = transaction.objectStore("pending");
  // Get all records from store 
  const getAll = store.getAll();

  getAll.onsuccess = function() {
      //Check if pending records
    if (getAll.result.length > 0) {
      fetch("/api/transaction/bulk", {
        method: "POST",
        body: JSON.stringify(getAll.result),
        headers: {
          Accept: "application/json, text/plain, */*",
          "Content-Type": "application/json"
        }
      })
      .then(response => response.json())
      .then(() => {
        // Open a transaction on pending db
        const transaction = db.transaction(["pending"], "readwrite");
        // Access pending object store
        const store = transaction.objectStore("pending");
        // Clear all items i
        store.clear();
      });
    }
  };
}

// Listen for app coming back online
window.addEventListener("online", checkDatabase);


