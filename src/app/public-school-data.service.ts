import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http'

import { Observable, of } from 'rxjs';
import { catchError, map, tap } from 'rxjs/operators';

import { PublicSchool } from './publicSchool';

@Injectable({
  providedIn: 'root'
})
export class PublicSchoolDataService {
  //private schoolUrl = 'https://hsinfo.s3.us-west-2.amazonaws.com/Public_School_Data.json';
  //private schoolUrl = 'http://localhost:4200/assets/Public_School_Data.json'
  private schoolUrl = 'https://henryko67.github.io/data/Public_School_Data_Truncated.json';

  httpOptions = {
    headers: new HttpHeaders({ 'Content-Type': 'application/json' })
  };

  constructor(
    private http: HttpClient
  ) { }

  // Retrieve private schools from server
  getPublicSchoolData(): Observable<PublicSchool[]> {
    //test code
    //this.http.get(this.testUrl).toPromise().then(info => {
      //console.log(JSON.stringify(info));
      //CHANGE THIS!!!!
      //const datum: PrivateSchool[] = JSON.parse(JSON.stringify(info));
      //console.log(datum[0].Private_School_Name);
      //console.log(info);
    //});
    return this.http.get<PublicSchool[]>(this.schoolUrl)
      .pipe(
        tap(_ => console.log('fetched public schools')),
        catchError(this.handleError<PublicSchool[]>('getPublicSchoolData', []))
      );
  }

  /**
   * Handle Http operation that failed.
   * Let the app continue.
   * @param operation - name of the operation that failed
   * @param result - optional value to return as the observable result
   */
  private handleError<T>(operation = 'operation', result?: T) {
    return (error: any): Observable<T> => {

      // TODO: send the error to remote logging infrastructure
      console.error(error); // log to console instead

      // TODO: better job of transforming error for user consumption
      console.log(`${operation} failed: ${error.message}`);

      // Let the app keep running by returning an empty result.
      return of(result as T);
    };
  }
}
