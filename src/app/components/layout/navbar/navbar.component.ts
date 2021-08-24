import {
    Component,
    OnInit,
    Input,
    Output,
    EventEmitter,
    ViewEncapsulation
} from '@angular/core';
import {
    Router
} from '@angular/router';
import {
    TranslateService
} from '@ngx-translate/core';
import {
    CookiesService
} from '../../../shared/services/cookies.service';

interface SelectItem {
    label: string;
    value: string;
};

@Component({
    selector: 'app-navbar',
    templateUrl: './navbar.component.html',
    styleUrls: ['./navbar.component.scss'],
    encapsulation: ViewEncapsulation.None
})
export class NavbarComponent implements OnInit {

    @Input() display: boolean;
    @Output() displayChange: EventEmitter < boolean > = new EventEmitter < boolean > ();

    userName: string;
    langs: SelectItem[] = [];

    constructor(
        private router: Router,
        private translate: TranslateService,
        private _cookies: CookiesService
    ) {}

    ngOnInit() {
        this.langs = [{
                label: 'espanol',
                value: 'es_AR'
            },
            {
                label: 'english',
                value: 'en'
            }
        ];
        this.userName = this._cookies.getCookie('nickname');
    }

    logout() {
        this._cookies.deleteAllCookies();
        this.router.navigate(['login']);
    }

    goHome() {
        this.router.navigate(['dashboard']);
    }

    changeLang($event) {
        this.translate.use($event.value);
    }

    collapseSidebar() {
        this.displayChange.emit(!this.display);
    }

    gotoProfile() {
        this.router.navigate(['user/edit']);
    }

}
