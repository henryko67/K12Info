import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http'

import { Observable, of } from 'rxjs';
import { catchError, map, tap } from 'rxjs/operators';

import { PrivateSchool } from './privateSchool';

@Injectable({
  providedIn: 'root'
})
export class PrivateSchoolDataService {
  //private schoolUrl = 'https://henryko67.github.io/data/Private_School_Data.json';
  private schoolUrl = 'https://henryko67.github.io/data/Private_School_Data_Truncated.json';

  httpOptions = {
    headers: new HttpHeaders({ 'Content-Type': 'application/json' })
  };

  constructor(
    private http: HttpClient
  ) { }

  // Retrieve private schools from server
  getPrivateSchoolData(): Observable<PrivateSchool[]> {
    //test code
    //this.http.get(this.testUrl).toPromise().then(info => {
      //console.log(JSON.stringify(info));
      //CHANGE THIS!!!!
      //const datum: PrivateSchool[] = JSON.parse(JSON.stringify(info));
      //console.log(datum[0].Private_School_Name);
      //console.log(info);
    //});
    return this.http.get<PrivateSchool[]>(this.schoolUrl)
      .pipe(
        tap(_ => console.log('fetched private schools')),
        catchError(this.handleError<PrivateSchool[]>('getPrivateSchoolData', []))
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
