-- New Arrivals is retired everywhere: delete the "New Arrivals" collection and clear the flag on every product.
DELETE FROM collections WHERE lower(name) = 'new arrivals' OR slug = 'new-arrivals';
UPDATE products SET new_arrival = false WHERE new_arrival;
