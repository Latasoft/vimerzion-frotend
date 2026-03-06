import { Component } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { SeleccionService } from '../../services/seleccion.service';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [RouterLink],
  templateUrl: './home.component.html',
  styleUrl: './home.component.css'
})
export class HomeComponent {
  constructor(private router: Router, private selectionService: SeleccionService) {}

  handleSelection(selection: string): void {
    this.selectionService.setSelection(selection);
    this.router.navigate(['/servicios']);
  }

}
