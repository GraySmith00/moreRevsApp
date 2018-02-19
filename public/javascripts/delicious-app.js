import '../sass/style.scss';

import { $, $$ } from './modules/bling';
import autocomplete from './modules/autocomplete';

// take the address, lat, and long inputs from the form as arguments in the autocomplete function
autocomplete( $('#address'), $('#lat'), $('#lng') );