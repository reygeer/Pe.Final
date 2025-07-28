import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient, HttpClientModule } from '@angular/common/http';
import { IonicModule } from '@ionic/angular';
import { Keyboard } from '@capacitor/keyboard';

Keyboard.setScroll({ isDisabled: false });

@Component({
  selector: 'app-tab5',
  templateUrl: './tab5.page.html',
  styleUrls: ['./tab5.page.scss'],
  standalone: true,
  imports: [IonicModule, CommonModule, FormsModule, HttpClientModule]
})
export class Tab5Page implements OnInit {
  segmentoActivo: string = 'first';

  productosDisponibles: any[] = [];
  cotizaciones: any[] = [];
  clientesDisponibles: any[] = [];
  clienteSeleccionado: string = '';

  totalCotizacion: number = 0;

  nuevaCotizacion = {
    cliente: '',
    fecha: '',
    productos: [
      { id: null, cantidad: 1 }
    ]
  };

  private apiBase = 'https://pe-backend-frontend.onrender.com/api';

  constructor(private http: HttpClient) {}

  ngOnInit() {
    this.cargarProductos();
    this.cargarCotizaciones();
    this.cargarClientes();
  }

  cargarProductos() {
    this.http.get<any[]>(`${this.apiBase}/productos`).subscribe(data => {
      this.productosDisponibles = data;
    });
  }

  cargarCotizaciones() {
    this.http.get<any[]>(`${this.apiBase}/cotizaciones`).subscribe(data => {
      this.cotizaciones = data;
    });
  }

  cargarClientes() {
    this.http.get<any[]>(`${this.apiBase}/clientes`).subscribe(data => {
      this.clientesDisponibles = data;
    });
  }

  verificarClienteSeleccionado() {
    if (this.clienteSeleccionado && this.clienteSeleccionado !== 'otro') {
      this.nuevaCotizacion.cliente = this.clienteSeleccionado;
    } else {
      this.nuevaCotizacion.cliente = '';
    }
  }

  agregarProducto() {
    this.nuevaCotizacion.productos.push({ id: null, cantidad: 1 });
    this.calcularTotal();
  }

  calcularTotal() {
    this.totalCotizacion = this.nuevaCotizacion.productos.reduce((total, prod) => {
      const productoInfo = this.productosDisponibles.find(p => p.id === prod.id);
      const precio = productoInfo?.precio || 0;
      return total + (precio * (prod.cantidad || 0));
    }, 0);
  }

  registrarCotizacion() {
    const productosValidos = this.nuevaCotizacion.productos.filter(p => p.id && p.cantidad > 0);
    if (!this.nuevaCotizacion.cliente || !this.nuevaCotizacion.fecha || productosValidos.length === 0) {
      alert('Por favor completa todos los campos y al menos un producto válido.');
      return;
    }

    const payload = {
      cliente: this.nuevaCotizacion.cliente,
      fecha: this.nuevaCotizacion.fecha,
      productos: productosValidos
    };

    this.http.post(`${this.apiBase}/cotizaciones`, payload).subscribe(() => {
      alert('Cotización registrada con éxito');
      this.resetFormulario();
      this.cargarCotizaciones();
      this.segmentoActivo = 'third';
    }, error => {
      alert('Error al registrar cotización');
      console.error(error);
    });
  }

  eliminarCotizacion(id: number) {
    if (!confirm('¿Seguro que quieres eliminar esta cotización?')) return;
    this.http.delete(`${this.apiBase}/cotizaciones/${id}`).subscribe(() => {
      alert('Cotización eliminada');
      this.cotizaciones = this.cotizaciones.filter(c => c.id !== id);
    }, error => {
      alert('Error al eliminar cotización');
      console.error(error);
    });
  }

  resetFormulario() {
    this.clienteSeleccionado = '';
    this.nuevaCotizacion = {
      cliente: '',
      fecha: '',
      productos: [{ id: null, cantidad: 1 }]
    };
    this.totalCotizacion = 0;
  }
}
