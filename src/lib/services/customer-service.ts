import { prisma } from "@/lib/db";
import * as customerRepository from "@/lib/repositories/customer-repository";
import * as observationRepository from "@/lib/repositories/observation-repository";
import { recordAuditLog } from "@/lib/repositories/audit-repository";
import { pushCustomerToAllProviders, tryLinkPipedriveOrganization } from "@/lib/integrations/sync-orchestrator";
import type { CustomerInput } from "@/lib/validations/customer";
import type { ObservationInput } from "@/lib/validations/observation";

export async function createCustomer(input: CustomerInput, actor: string) {
  const customer = await customerRepository.createCustomer(input);
  await recordAuditLog({
    action: "customer.create",
    entityId: customer.id,
    actor,
    detail: `Empresa: ${customer.companyName}`,
  });
  await tryLinkPipedriveOrganization(customer.id, customer.companyName);
  await pushCustomerToAllProviders(customer);
  return customer;
}

export async function updateCustomer(id: string, input: CustomerInput, actor: string) {
  const customer = await customerRepository.updateCustomer(id, input);
  await recordAuditLog({
    action: "customer.update",
    entityId: customer.id,
    actor,
    detail: `Empresa: ${customer.companyName}`,
  });
  await pushCustomerToAllProviders(customer);
  return customer;
}

export async function deleteCustomer(id: string, actor: string) {
  const existing = await customerRepository.findCustomerDetailById(id);
  await customerRepository.deleteCustomer(id);
  await recordAuditLog({
    action: "customer.delete",
    entityId: id,
    actor,
    detail: `Empresa: ${existing.companyName}`,
  });
  // Os registros externos (Smartsheet/Pipedrive) não são apagados automaticamente
  // — apenas desvinculados — para evitar exclusão destrutiva em sistemas
  // compartilhados sem confirmação explícita do time comercial/relacionamento.
  await prisma.externalLink.deleteMany({ where: { customerId: id } }).catch(() => undefined);
}

/** Reenvia manualmente um cliente para Smartsheet e Pipedrive (fallback caso o sync automático falhe). */
export async function resyncCustomer(id: string) {
  const customer = await customerRepository.findCustomerDetailById(id);
  await pushCustomerToAllProviders(customer);
  return customer;
}

export async function addObservation(customerId: string, input: ObservationInput, actor: string) {
  const observation = await observationRepository.addObservation(customerId, input);
  await recordAuditLog({
    action: "observation.create",
    entityId: customerId,
    actor,
    detail: observation.text.slice(0, 140),
  });
  return observation;
}
