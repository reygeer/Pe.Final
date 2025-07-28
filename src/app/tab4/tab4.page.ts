import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient, HttpClientModule } from '@angular/common/http';
import { IonicModule, AlertController } from '@ionic/angular';
import { Keyboard } from '@capacitor/keyboard';

Keyboard.setScroll({ isDisabled: false });

@Component({
  selector: 'app-tab4',
  templateUrl: './tab4.page.html',
  styleUrls: ['./tab4.page.scss'],
  standalone: true,
  imports: [CommonModule, FormsModule, IonicModule, HttpClientModule],
})
export class Tab4Page implements OnInit {
  segmentoActivo: string = 'registrar';

  productos: any[] = [];
  proveedores: any[] = [];

  previewImage: string | ArrayBuffer | null = null;
  imagenFile: File | null = null;

  nuevoProducto = {
    nombre: '',
    descripcion: '',
    marca: '',
    modelo: '',
    voltaje: '',
    potencia: '',
    corriente: '',
    precio: null as number | null,
    imagen_base64: '',
    proveedor_id: null as number | null,
  };

  productoSeleccionadoId: number | null = null;
  productoEditable: any = null;

  private apiUrl = 'https://pe-backend-frontend.onrender.com/api/productos';
  private apiProveedores = 'https://pe-backend-frontend.onrender.com/api/proveedores';

  constructor(private http: HttpClient, private alertCtrl: AlertController) {}

  ngOnInit() {
    this.cargarProductos();
    this.cargarProveedores();
  }

  cargarProductos() {
    this.http.get<any[]>(this.apiUrl).subscribe({
      next: (data) => {
        this.productos = data;
      },
      error: (err) => {
        console.error('Error al cargar productos:', err);
        this.mostrarAlerta('Error al cargar productos');
      },
    });
  }

  cargarProveedores() {
    this.http.get<any[]>(this.apiProveedores).subscribe({
      next: (data) => {
        this.proveedores = data;
      },
      error: (err) => {
        console.error('Error al cargar proveedores:', err);
        this.mostrarAlerta('Error al cargar proveedores');
      },
    });
  }

  onFileSelected(event: any) {
    const file = event.target.files[0];
    if (file) {
      this.imagenFile = file;
      const reader = new FileReader();
      reader.onload = () => {
        this.previewImage = reader.result;
        this.nuevoProducto.imagen_base64 = reader.result as string;
      };
      reader.readAsDataURL(file);
    }
  }

  onFileSelectedEditar(event: any) {
    const file = event.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = () => {
        if (this.productoEditable) {
          this.productoEditable.imagen_base64 = reader.result as string;
        }
      };
      reader.readAsDataURL(file);
    }
  }

  registrarProducto() {
    if (!this.nuevoProducto.nombre) {
      this.mostrarAlerta('El nombre es obligatorio');
      return;
    }
    if (this.nuevoProducto.proveedor_id === null) {
      this.mostrarAlerta('Debe seleccionar un proveedor');
      return;
    }

    console.log('Producto a registrar:', this.nuevoProducto);

    this.http.post(`${this.apiUrl}/guardar`, this.nuevoProducto).subscribe({
      next: () => {
        this.mostrarAlerta('Producto registrado correctamente');
        this.limpiarNuevoProducto();
        this.cargarProductos();
        this.segmentoActivo = 'listar';
      },
      error: (err) => {
        console.error('Error al registrar producto:', err);
        this.mostrarAlerta('Error al registrar producto');
      },
    });
  }

  limpiarNuevoProducto() {
    this.nuevoProducto = {
      nombre: '',
      descripcion: '',
      marca: '',
      modelo: '',
      voltaje: '',
      potencia: '',
      corriente: '',
      precio: null,
      imagen_base64: '',
      proveedor_id: null,
    };
    this.previewImage = null;
    this.imagenFile = null;
  }

  cargarProductoSeleccionado() {
    const producto = this.productos.find((p) => p.id === this.productoSeleccionadoId);
    if (producto) {
      this.productoEditable = { ...producto };
      if (!this.productoEditable.proveedor_id) {
        this.productoEditable.proveedor_id = null;
      }
    } else {
      this.productoEditable = null;
    }
  }

  guardarEdicion() {
    if (!this.productoEditable || !this.productoEditable.id) {
      this.mostrarAlerta('Producto no válido para editar');
      return;
    }
    if (this.productoEditable.proveedor_id === null) {
      this.mostrarAlerta('Debe seleccionar un proveedor');
      return;
    }

    console.log('Producto a editar:', this.productoEditable);

    const url = `${this.apiUrl}/${this.productoEditable.id}`;
    this.http.put(url, this.productoEditable).subscribe({
      next: () => {
        this.mostrarAlerta('Producto actualizado correctamente');
        this.cargarProductos();
        this.segmentoActivo = 'listar';
      },
      error: (err) => {
        console.error('Error al actualizar producto:', err);
        this.mostrarAlerta('Error al actualizar producto');
      },
    });
  }

  eliminarProducto(id: number) {
    if (confirm('¿Estás seguro de eliminar este producto?')) {
      this.http.delete(`${this.apiUrl}/${id}`).subscribe({
        next: () => {
          this.mostrarAlerta('Producto eliminado correctamente');
          this.cargarProductos();
          this.productoSeleccionadoId = null;
          this.productoEditable = null;
          this.segmentoActivo = 'listar';
        },
        error: (err) => {
          console.error('Error al eliminar producto:', err);
          this.mostrarAlerta('Error al eliminar producto');
        },
      });
    }
  }

  obtenerNombreProveedor(id: number): string {
    const proveedor = this.proveedores.find((p) => p.id === id);
    return proveedor ? proveedor.nombre : 'Sin proveedor';
  }

  async mostrarAlerta(mensaje: string) {
    const alert = await this.alertCtrl.create({
      header: 'Alerta',
      message: mensaje,
      buttons: ['OK'],
    });
    await alert.present();
  }
}
