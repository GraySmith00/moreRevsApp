function autocomplete(input, latInput, lngInput) {
  if(!input) return; // skip this function from running if theres no input
  
  // integrat google maps api for the dropdown
  const dropdown = new google.maps.places.Autocomplete(input);
  
  // use autocomplete to populate lat and long
  dropdown.addListener('place_changed', () => {
    const place = dropdown.getPlace();
    latInput.value = place.geometry.location.lat();
    lngInput.value = place.geometry.location.lng();
  });
  
  // if someone hits enter on the address field, don't submit the form
  input.on('keydown', (event) => {
    if(event.keyCode === 13) event.preventDefault();
  });
}

export default autocomplete;