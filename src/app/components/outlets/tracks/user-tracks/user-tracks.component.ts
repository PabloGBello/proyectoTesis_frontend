import {
    Component
} from '@angular/core';
import {
    TracksService
} from '../../../../shared/services/tracks.service';
import {
    BehaviorSubject,
    Observable,
    pipe
} from 'rxjs';
import {
    tap,
    map,
    skip,
    filter
} from 'rxjs/operators';
import {
    CitiesService
} from '../../../../shared/services/cities.service';
import {
    City,
    MapOptions
} from '../../../../shared/interfaces/City';
import {
    Track
} from '../../../../shared/interfaces/Track';
import {
    MapFilter
} from '../../../../shared/interfaces/MapFilter';
import {
    MapsService
} from '../../../../shared/services/maps.service';
import {
    RoadCategories
} from '../../../../shared/interfaces/Categories';
import {
    CookiesService
} from '../../../../shared/services/cookies.service';

import {
    MatDatepickerInputEvent
} from '@angular/material/datepicker';
import {
    DateAdapter
} from '@angular/material/core';
import {
    Polyline
} from 'src/app/shared/interfaces/Polyline';


declare const google: any;

@Component({
    selector: 'app-user-tracks',
    templateUrl: './user-tracks.component.html',
    styleUrls: ['./user-tracks.component.scss']
})
export class UserTracksComponent {

    // TODO: remove this mock and use the center subject!
    public currentMapOptions: MapOptions = {
        center: {
            lat: -37.3234275,
            lng: -59.1371982
        },
        zoom: 12
    };

    public currentTrack: Polyline[] = [];

    private username: string = null;
    private tracks: Track[] = [];
    roadCategories: RoadCategories = null;
    roadCategoriesIterable = [];

    cities: Observable < City[] > = new Observable < City[] > ();
    currentCity: City = null;
    private citySubject: BehaviorSubject < City > = new BehaviorSubject < City > (this.currentCity);

    private _trackIndex: number = null;
    private trackIndexSubject: BehaviorSubject < number > = new BehaviorSubject < number > (this._trackIndex);

    dateFilter = {
        from: new Date(1520793625606.0),
        to: new Date(1537656635848.0)
    };

    public paginationLimit = 5;
    public offset = 0;

    constructor(
        private _cities: CitiesService,
        private _tracks: TracksService,
        private _maps: MapsService,
        private _cookies: CookiesService,
        private _adapter: DateAdapter < any >
    ) {
        this._adapter.setLocale('es-ES');
        this.username = this._cookies.getCookie('username');
        this.cities = this._cities.getCities()
            .pipe(
                tap((cities: City[]) => {
                    this.changeCurrentCity(cities[0]);
                })
            );

        this.citySubject.asObservable()
            .pipe(
                skip(1),
                map((city: City) => {
                    return <MapOptions> {
                        center: city.center,
                        zoom: city.zoom
                    };
                })
            )
            .subscribe((newMapCenter: MapOptions) => {
                this.currentMapOptions = newMapCenter;
            });

        this.trackIndexSubject.asObservable()
            .pipe(
                skip(1),
                filter((nextIndex: number) => (this.tracks.length > 0)),
                map((nextIndex: number) => this.tracks[nextIndex]),
                tap((trackToDraw: Track) => {
                    this.roadCategories = this._maps.getRelativeRoadCategories(trackToDraw.ranges);
                    this.roadCategoriesIterable = Object.entries(this.roadCategories)
                        .map((entry: any[]) => < Object > {
                            text: entry[0],
                            color: entry[1].color
                        });
                }),
                map((trackToDraw: Track) => this._maps.getPolylinesFromRanges(trackToDraw.ranges))
            ).subscribe((polyLines: Polyline[]) => {
                this.currentTrack = polyLines;
            });
    }


    // ? Why do I need this currentCity property besides the Observable??
    // TODO: take a look at this
    public changeCurrentCity(c: City): void {
        this.currentCity = c;
        this.citySubject.next(this.currentCity);
    }

    public changeTrackIndex(n: number): void {
        this._trackIndex = this._trackIndex + n;
        this.trackIndexSubject.next(this._trackIndex);
    }

    public getTrackIndex(): number {
        return this.trackIndexSubject.value;
    }

    public fetchUserTracks(): void {
        const filterObject: MapFilter = {
            user: this.username,
            city: this.currentCity.name,
            startTime: {
                from: Date.parse(this.dateFilter.from.toDateString()),
                to: Date.parse(this.dateFilter.to.toDateString())
            },
            pages: this.paginationLimit,
            offset: this.offset
        };
        this._tracks.getUserTracks(filterObject)
            .subscribe((tracks: Track[]) => {
                this.tracks = tracks;
                this.trackIndexSubject.next(0);
            }, err => {
                console.error(err);
            });
    }

    // TODO: this probably would need a refactor
    public onDateChange($event: MatDatepickerInputEvent < Date > , name): void {
        this.dateFilter[name] = $event.value;
    }
}
