import type {
  TicketDTO,
  TicketListItemDTO,
  TicketStatus,
  TicketAssignmentDTO,
  TicketStatusUpdateDTO,
} from "@/src/types";

/**
 * Mapper Pattern - mapuje dane z bazy danych do DTO
 * Separuje strukturę bazy od struktury API
 */
export class TicketMapper {
  /**
   * Mapuje pojedynczy ticket z relacjami do TicketDTO
   */
  static toTicketDTO(ticket: any): TicketDTO {
    return {
      id: ticket.id,
      title: ticket.title,
      description: ticket.description,
      status: ticket.status as TicketStatus,
      subcategoryId: ticket.subcategory_id,
      subcategory: {
        id: ticket.subcategories.id,
        name: ticket.subcategories.name,
        categoryId: ticket.subcategories.category_id,
        description: ticket.subcategories.description,
        category: {
          id: ticket.subcategories.categories.id,
          name: ticket.subcategories.categories.name,
        },
      },
      createdById: ticket.created_by_id,
      createdBy: {
        id: ticket.createdBy!.id,
        name: ticket.createdBy!.name,
        email: ticket.createdBy!.email,
      },
      assignedToId: ticket.assigned_to_id,
      assignedTo: ticket.assignedTo
        ? {
            id: ticket.assignedTo.id,
            name: ticket.assignedTo.name,
            email: ticket.assignedTo.email,
          }
        : null,
      createdAt: ticket.created_at,
      updatedAt: ticket.updated_at,
    };
  }

  /**
   * Mapuje ticket do TicketListItemDTO (lista)
   */
  static toTicketListItemDTO(ticket: any): TicketListItemDTO {
    return {
      id: ticket.id,
      title: ticket.title,
      status: ticket.status as TicketStatus,
      subcategory: {
        id: ticket.subcategories.id,
        name: ticket.subcategories.name,
        categoryId: ticket.subcategories.category_id,
        description: ticket.subcategories.description,
        category: {
          id: ticket.subcategories.categories.id,
          name: ticket.subcategories.categories.name,
        },
      },
      createdBy: {
        id: ticket.createdBy!.id,
        name: ticket.createdBy!.name,
        email: ticket.createdBy!.email,
      },
      assignedTo: ticket.assignedTo
        ? {
            id: ticket.assignedTo.id,
            name: ticket.assignedTo.name,
            email: ticket.assignedTo.email,
          }
        : null,
      createdAt: ticket.created_at,
      updatedAt: ticket.updated_at,
    };
  }

  /**
   * Mapuje wiele ticketów do listy
   */
  static toTicketListDTO(tickets: any[]): TicketListItemDTO[] {
    return tickets.map((ticket) => this.toTicketListItemDTO(ticket));
  }

  /**
   * Mapuje dane po przypisaniu ticketu
   */
  static toTicketAssignmentDTO(ticket: any): TicketAssignmentDTO {
    return {
      ticket: {
        id: ticket.id,
        title: ticket.title,
        status: ticket.status as TicketStatus,
        assignedToId: ticket.assigned_to_id!,
        assignedTo: {
          id: ticket.assignedTo!.id,
          name: ticket.assignedTo!.name,
          email: ticket.assignedTo!.email,
        },
        updatedAt: ticket.updated_at,
      },
    };
  }

  /**
   * Mapuje dane po zmianie statusu
   */
  static toTicketStatusUpdateDTO(ticket: any): TicketStatusUpdateDTO {
    return {
      ticket: {
        id: ticket.id,
        title: ticket.title,
        status: ticket.status as TicketStatus,
        updatedAt: ticket.updated_at,
      },
    };
  }
}

