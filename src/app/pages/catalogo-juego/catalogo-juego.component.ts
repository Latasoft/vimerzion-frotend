import { Component } from '@angular/core';
import { CatalogJuego, FetchCatalogo } from '../../models/catalogo';
import { CatalogoService } from '../../services/catalogo.service';
import { finalize, switchMap, tap } from 'rxjs';
import { CommonModule } from '@angular/common';
import { ActivatedRoute } from '@angular/router';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';
import { Subject } from 'rxjs';

@Component({
  selector: 'app-catalogo-juego',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './catalogo-juego.component.html',
  styleUrls: ['./catalogo-juego.component.css']
})
export class CatalogoJuegoComponent {
  juegos: FetchCatalogo[] = [];
  total: number = 0;
  page: number = 1;
  pages: number = 1;
  limit: number = 10;
  loading: boolean = false;

  currentPlatform: string | null = null;
  selectedJuego: any | null = null;
  logoUrl: string = '';

  constructor(
    private gameService: CatalogoService,
    private route: ActivatedRoute,
    private sanitizer: DomSanitizer
  ) { }

  ngOnInit(): void {
     //Funcion antigua
    // 🔥 SOLO UNA SUSCRIPCIÓN — SIN MEMORY LEAKS
    //this.route.queryParams
    // .pipe(
    //   tap((params) => {
    //     const newPlatform = params['platform']
    //       ? this.mapPlatform(params['platform'])
    //       : null;

    //     // 🔥 SI CAMBIA LA PLATAFORMA → REINICIAR PAGINACIÓN
    //     if (newPlatform !== this.currentPlatform) {
    //       this.page = 1;
    //     }

    //     this.currentPlatform = newPlatform;
    //     this.assignPlatformLogo(newPlatform);
    //   }),

    //   // 🔥 CADA VEZ QUE CAMBIE LA PLATAFORMA O LA PÁGINA → CONSULTA A LA API
    //   switchMap(() => {
    //     this.loading = true;
    //     return this.gameService
    //       .getCatalogData(this.page, this.limit, this.currentPlatform)
    //       .pipe(finalize(() => (this.loading = false)));
    //   })
    // )
    // .subscribe({
    //   next: (response) => {
    //     this.juegos = response.games;
    //     this.total = response.total;
    //     this.page = response.page;
    //     this.pages = response.pages;
    //   },
    //   error: (error) => {
    //     console.error('Error al cargar el catálogo de juegos:', error);
    //     this.juegos = [];
    //   },
    // });

    //Funcion nueva
    this.route.queryParams.subscribe(params => {
      const platformParam = params['platform']
        ? this.mapPlatform(params['platform'])
        : null;

      if (platformParam !== this.currentPlatform) {
        this.page = 1;
      }

      this.currentPlatform = platformParam;
      this.assignPlatformLogo(platformParam);

      this.fetchCatalog();
    });

  }

  fetchCatalog(): void {
    this.loading = true;

    this.gameService
      .getCatalogData(this.page, this.limit, this.currentPlatform)
      .pipe(finalize(() => (this.loading = false)))
      .subscribe({
        next: (response) => {
          this.juegos = response.games;
          this.total = response.total;
          this.page = response.page;
          this.pages = response.pages;
        },
        error: (error) => {
          console.error('Error al cargar el catálogo:', error);
          this.juegos = [];
        },
      });
  }


  // ✔ Error de imagen → imagen por defecto
  handleImageError(event: Event): void {
    const img = event.target as HTMLImageElement;
    if (img) img.src = 'assets/default-game.jpg';
  }

  // ✔ Logo dinámico para la plataforma seleccionada
  assignPlatformLogo(platformName: string | null): void {
    this.logoUrl = platformName
      ? this.getLogoUrl(platformName)
      : 'assets/default-logo.svg';
  }

  getLogoUrl(platformName: string): string {
    const logos: { [key: string]: string } = {
      'PlayStation 5': 'assets/ps5.png',
      'PlayStation vr': 'assets/PlayStation_VR2_logo (1).svg',
      'Nintendo Switch': 'assets/Nintendo_Switch_Logo (1).svg',
      'Meta Quest 2': 'assets/Oculus_(10).svg',
      'Meta Quest 3': 'assets/meta2.svg',
      'Simuladores PsVr 2': 'assets/PlayStation_VR2_logo (1).svg',
      '1 Jugador': 'assets/Oculus_(10).svg',
      '2 Jugador': 'assets/Oculus_(10).svg',
      '3 Jugador': 'assets/Oculus_(10).svg',
      '4 Jugador': 'assets/Oculus_(10).svg',
      'Simuladores': 'assets/PlayStation_VR2_logo (1).svg',
    };

    return logos[platformName] || 'assets/default-logo.svg';
  }

  openModal(juego: any): void {
    if (!juego.plataforma || typeof juego.plataforma !== 'object') {
      console.error('Plataforma no definida o no es un objeto:', juego);
      return;
    }

    const sanitizedVideoUrl = this.sanitizeVideoUrl(juego.plataforma.videoUrl);

    this.selectedJuego = {
      ...juego,
      plataforma: {
        ...juego.plataforma,
        videoUrl: sanitizedVideoUrl,
      },
      hashtags: juego.hashtags || [],
      valoracion: juego.valoracion || 0,
    };
  }

  sanitizeVideoUrl(videoUrl: string): SafeResourceUrl {
    if (videoUrl?.includes('youtube.com/watch')) {
      const embedUrl = videoUrl.replace('watch?v=', 'embed/');
      return this.sanitizer.bypassSecurityTrustResourceUrl(embedUrl);
    }
    return this.sanitizer.bypassSecurityTrustResourceUrl(videoUrl);
  }

  mapPlatform(platform: string): string {
    const platformMap: { [key: string]: string } = {
      playstation_5: 'PlayStation 5',
      playstation_vr: 'PlayStation vr',
      nintendo_switch: 'Nintendo Switch',
      meta_quest_2: 'Meta Quest 2',
      meta_quest_3: 'Meta Quest 3',
      simuladores_psvr_2: 'Simuladores PsVr 2',
      jugador_1: '1 Jugador',
      jugador_2: '2 Jugador',
      jugador_3: '3 Jugador',
      jugador_4: '4 Jugador',
      simuladores: 'Simuladores',
    };

    return platformMap[platform] || platform;
  }

  closeModal(): void {
    this.selectedJuego = null;
  }

  // 🔥 AHORA ESTAS FUNCIONES SOLO CAMBIAN LA PÁGINA
  // y Angular automáticamente vuelve a hacer la consulta
  nextPage(): void {
    if (this.page < this.pages) {
      this.page++;
      this.fetchCatalog();
      //this.triggerRefresh();
    }
  }

  prevPage(): void {
    if (this.page > 1) {
      this.page--;
      this.fetchCatalog();
      //this.triggerRefresh();
    }
  }

  // Fuerza un refresco actualizando queryParams “virtualmente”
  // private triggerRefresh(): void {
  //   // Esto vuelve a activar la suscripción principal de ngOnInit
  //   this.route.queryParams.subscribe(() => {});
  // }

  trackById(index: number, item: FetchCatalogo): string {
    return item._id;
  }
}