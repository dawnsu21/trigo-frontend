# Implementation Guide: Backend First Approach

## Why Start with Backend?

1. **Data Structure Foundation**: Backend defines how data is stored and relationships work
2. **API Contracts**: Frontend needs to know what endpoints exist and what they return
3. **Business Logic**: Core functionality (fare calculation, ride matching) belongs in backend
4. **Security**: Role-based access control must be server-side
5. **Places System**: Need to seed Bulan locations before frontend can use them

---

## Step-by-Step Backend Implementation

### Phase 1: Places/Locations System (START HERE)

#### 1.1 Create Places Migration
```php
// Create places table
Schema::create('places', function (Blueprint $table) {
    $table->id();
    $table->string('name'); // "Bulan Public Market"
    $table->text('address'); // Full address
    $table->decimal('latitude', 10, 8);
    $table->decimal('longitude', 11, 8);
    $table->string('category')->nullable(); // landmark, barangay, establishment
    $table->boolean('is_active')->default(true);
    $table->timestamps();
});
```

#### 1.2 Create Place Model
```php
class Place extends Model
{
    protected $fillable = ['name', 'address', 'latitude', 'longitude', 'category', 'is_active'];
}
```

#### 1.3 Create Places Controller
```php
class PlaceController extends Controller
{
    public function index() {
        return Place::where('is_active', true)->get();
    }
    
    public function search(Request $request) {
        $query = $request->get('q');
        return Place::where('is_active', true)
            ->where('name', 'like', "%{$query}%")
            ->orWhere('address', 'like', "%{$query}%")
            ->get();
    }
}
```

#### 1.4 Seed Bulan Places
Create a seeder with common locations in Bulan:
- Barangays
- Landmarks (Port, Market, Plaza)
- Schools
- Government offices

---

### Phase 2: Update Ride Booking

#### 2.1 Update Rides Table
```php
// Add place_id columns instead of just coordinates
$table->foreignId('pickup_place_id')->constrained('places');
$table->foreignId('dropoff_place_id')->constrained('places');
// Keep coordinates for flexibility
$table->decimal('pickup_lat', 10, 8)->nullable();
$table->decimal('pickup_lng', 11, 8)->nullable();
$table->decimal('drop_lat', 10, 8)->nullable();
$table->decimal('drop_lng', 11, 8)->nullable();
```

#### 2.2 Update Ride Creation
```php
// In PassengerRideController
public function store(Request $request) {
    // Accept either place_id or coordinates
    $pickupPlace = $request->pickup_place_id 
        ? Place::find($request->pickup_place_id)
        : null;
    
    $dropoffPlace = $request->dropoff_place_id
        ? Place::find($request->dropoff_place_id)
        : null;
    
    // Calculate fare based on distance
    $fare = $this->calculateFare($pickupPlace, $dropoffPlace);
    
    // Create ride...
}
```

---

### Phase 3: Fare Calculation

#### 3.1 Distance Calculation
```php
private function calculateFare($pickupPlace, $dropoffPlace) {
    // Calculate distance using Haversine formula
    $distance = $this->calculateDistance(
        $pickupPlace->latitude, $pickupPlace->longitude,
        $dropoffPlace->latitude, $dropoffPlace->longitude
    );
    
    // Base fare + per kilometer
    $baseFare = 15.00; // PHP
    $perKm = 10.00; // PHP per kilometer
    
    return $baseFare + ($distance * $perKm);
}
```

---

### Phase 4: Driver Matching

#### 4.1 Find Nearby Drivers
```php
// When ride is created, find nearby online drivers
public function findNearbyDrivers($pickupLat, $pickupLng, $radiusKm = 5) {
    return Driver::where('is_online', true)
        ->where('status', 'approved')
        ->whereRaw(
            "(6371 * acos(cos(radians(?)) * cos(radians(latitude)) * 
            cos(radians(longitude) - radians(?)) + 
            sin(radians(?)) * sin(radians(latitude)))) <= ?",
            [$pickupLat, $pickupLng, $pickupLat, $radiusKm]
        )
        ->get();
}
```

---

### Phase 5: Real-Time Updates

#### 5.1 Driver Location Updates
```php
// Store driver's current location
public function updateLocation(Request $request) {
    $driver = auth()->user()->driver;
    
    $driver->update([
        'latitude' => $request->lat,
        'longitude' => $request->lng,
        'location_updated_at' => now()
    ]);
    
    return response()->json(['message' => 'Location updated']);
}
```

---

## Frontend Integration (After Backend is Ready)

### Update Passenger Dashboard
Replace coordinate inputs with PlaceSelector component:

```jsx
// Instead of:
<input name="pickup_lat" />
<input name="pickup_lng" />

// Use:
<PlaceSelector
  label="Pickup Location"
  value={rideForm.pickup_place_id}
  onChange={handleChange}
  required
/>
```

### Update API Calls
```javascript
// passengerService.js
export function createPassengerRide(token, payload) {
  // Now accepts place_id instead of coordinates
  return apiRequest('/api/passenger/rides', {
    method: 'POST',
    token,
    body: {
      pickup_place_id: payload.pickup_place_id,
      dropoff_place_id: payload.dropoff_place_id,
      notes: payload.notes
    }
  })
}
```

---

## Testing Checklist

### Backend:
- [ ] Places API returns list of Bulan locations
- [ ] Search places works
- [ ] Ride booking accepts place_id
- [ ] Fare calculation works correctly
- [ ] Driver matching finds nearby drivers
- [ ] Role-based access control works
- [ ] Driver approval workflow works

### Frontend (After Backend):
- [ ] PlaceSelector component loads places
- [ ] Users can search and select places
- [ ] Ride booking uses selected places
- [ ] Current ride shows place names (not coordinates)
- [ ] History shows place names

---

## Recommended Order:

1. ✅ **Backend: Places System** (1-2 days)
2. ✅ **Backend: Update Ride Booking** (1 day)
3. ✅ **Backend: Fare Calculation** (1 day)
4. ✅ **Backend: Driver Matching** (1 day)
5. ✅ **Frontend: Integrate PlaceSelector** (1 day)
6. ✅ **Testing & Refinement** (1-2 days)

---

## Bulan Places to Seed:

### Barangays:
- Poblacion
- Zone 1, 2, 3, etc.
- (Add all barangays in Bulan)

### Landmarks:
- Bulan Port
- Bulan Public Market
- Bulan Town Plaza
- Bulan Municipal Hall

### Schools:
- Bulan National High School
- (Add other schools)

### Establishments:
- (Add popular businesses, terminals, etc.)

---

## Next Steps:

1. **Start with Places migration and seeder**
2. **Test Places API endpoints**
3. **Update ride booking to use places**
4. **Implement fare calculation**
5. **Then update frontend to use PlaceSelector**

This approach ensures the backend foundation is solid before building the frontend features.

