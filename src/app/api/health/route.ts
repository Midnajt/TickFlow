import { NextResponse } from 'next/server';
import connectDB from '@/lib/db/mongodb';

export async function GET() {
  try {
    await connectDB();
    
    return NextResponse.json(
      { 
        status: 'success',
        message: 'Połączenie z bazą danych MongoDB zostało nawiązane pomyślnie',
        timestamp: new Date().toISOString()
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('Błąd połączenia z bazą danych:', error);
    
    return NextResponse.json(
      { 
        status: 'error',
        message: 'Nie udało się połączyć z bazą danych MongoDB',
        error: error instanceof Error ? error.message : 'Nieznany błąd',
        timestamp: new Date().toISOString()
      },
      { status: 500 }
    );
  }
}

