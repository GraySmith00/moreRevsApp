import axios from 'axios';
import { $ } from './bling';

function ajaxHeart(e) {
    // prevents default JSON render
    e.preventDefault();
    
    axios
        // this is equal to the form tag (form.heart) passed in as e
        .post(this.action)
        .then( res => {
            // accessing the form button with name of heart
            const isHearted = this.heart.classList.toggle('heart__button--hearted');
            $('.heart-count').textContent = res.data.hearts.length;
            if(isHearted) {
                this.heart.classList.add('heart__button--float');
                setTimeout(() => this.heart.classList.remove('heart__button--float'),
                2500);
            }
        })
        .catch(console.error);
}

export default ajaxHeart;